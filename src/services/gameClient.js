import { createSocket, publishJson, subscribeJson } from './socketService';

// ---------------------------------------------------------------------------
// The player's "ticket" for a room. Survives a page refresh (sessionStorage is
// per-tab, so two tabs can play as two different players while testing).
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'qontrol-player-session';

export function loadPlayerSession() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}
function savePlayerSession(value) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — rejoin-after-refresh just won't work */
  }
}
export function clearPlayerSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Timing. Messages sent right after a SUBSCRIBE can overtake it on the server
// (inbound frames are handled on a thread pool), so we wait a beat before the
// first message, and resend until the server answers. join/sync are idempotent.
// ---------------------------------------------------------------------------
const SETTLE_MS = 150;
const RETRY_MS = 1500;
const MAX_TRIES = 5;

// Errors that mean "this room is gone / you are not in it" even after we were ready.
const FATAL_ANY_TIME = new Set(['ROOM_NOT_FOUND', 'REJOIN_FAILED', 'NOT_IN_GAME']);
// Errors that mean the answer we just sent did not count.
const ANSWER_ERRORS = new Set(['ANSWER_CLOSED', 'STALE_QUESTION', 'ALREADY_ANSWERED', 'INVALID_OPTION']);
// Errors after which a saved player ticket is useless.
const FORGET_TICKET = new Set(['ROOM_NOT_FOUND', 'REJOIN_FAILED', 'NOT_IN_GAME', 'GAME_IN_PROGRESS']);

/**
 * One instance per browser tab. Owns the socket; talks to React only through
 * `dispatch` (see gameReducer) so it can be tested without React.
 */
export function createGameClient({ dispatch, getState, socketFactory = createSocket }) {
  let session = null;

  // ----- lifecycle -------------------------------------------------------

  function destroy(s) {
    if (!s) return;
    s.closed = true;
    clearTimeout(s.timer);
    try {
      s.client?.deactivate();
    } catch {
      /* already closed */
    }
  }

  function fail(s, error) {
    if (s !== session) return;
    if (s.role === 'PLAYER' && FORGET_TICKET.has(error.code)) clearPlayerSession();
    dispatch({ type: 'ERROR', error, fatal: true });
    dispatch({ type: 'CONNECTION', connection: 'idle' });
    s.reject(error);
    destroy(s);
    session = null;
  }

  function start(config) {
    if (session && session.role === config.role && session.roomCode === config.roomCode) {
      return session.promise; // StrictMode / double effects: reuse the live session
    }
    leave({ keepTicket: true });

    dispatch({ type: 'SESSION_START', role: config.role, roomCode: config.roomCode });
    const s = {
      ...config,
      client: null,
      closed: false,
      ready: false,
      stage: config.role === 'HOST' ? 'syncing' : 'joining',
      tries: 0,
      timer: null,
      answeredQuestion: null,
    };
    s.promise = new Promise((resolve, reject) => {
      s.resolve = resolve;
      s.reject = reject;
    });
    s.promise.catch(() => {}); // callers handle it; avoid "unhandled rejection" noise
    session = s;

    s.client = socketFactory({
      token: config.token,
      onConnect: (client) => onConnected(s, client),
      onClose: () => onClosed(s),
      onProtocolError: (message) =>
        fail(s, {
          code: /token|auth/i.test(message) ? 'AUTH' : 'CONNECT_FAILED',
          message: /token|auth/i.test(message)
            ? 'Your session expired. Please log in again.'
            : 'Could not connect to the game server.',
        }),
    });
    return s.promise;
  }

  function leave({ keepTicket = false } = {}) {
    const s = session;
    session = null;
    if (!s) {
      if (!keepTicket) dispatch({ type: 'RESET' });
      return;
    }
    s.reject({ code: 'CANCELLED', message: 'Left the game' });
    destroy(s);
    if (!keepTicket) clearPlayerSession();
    dispatch({ type: 'RESET' });
  }

  // ----- connection events ----------------------------------------------

  function onConnected(s, client) {
    if (s !== session || s.closed) return;
    s.client = client;
    s.ready = false;
    s.stage = s.role === 'HOST' ? 'syncing' : 'joining';

    // stompjs forgets subscriptions on reconnect, so (re)subscribe every time.
    subscribeJson(client, `/topic/room/${s.roomCode}`, (event) => dispatch({ type: 'EVENT', event }));
    subscribeJson(client, '/user/queue/errors', (error) => onError(s, error));
    subscribeJson(client, '/user/queue/sync', (sync) => onSync(s, sync));
    if (s.role === 'PLAYER') {
      subscribeJson(client, '/user/queue/join', (ack) => onJoinAck(s, ack));
      subscribeJson(client, '/user/queue/answer-ack', (ack) => dispatch({ type: 'ANSWER_ACK', ack }));
      subscribeJson(client, '/user/queue/answer-result', (result) => dispatch({ type: 'RESULT', result }));
      subscribeJson(client, '/user/queue/kicked', () => onKicked(s));
    }
    schedule(s, SETTLE_MS);
  }

  function onClosed(s) {
    if (s !== session) return;
    clearTimeout(s.timer);
    if (s.ready) {
      s.ready = false;
      dispatch({ type: 'CONNECTION', connection: 'reconnecting' });
    }
  }

  // ----- handshake: join (players) then sync (everyone) ------------------

  function schedule(s, delay) {
    clearTimeout(s.timer);
    s.tries = 0;
    s.timer = setTimeout(() => attempt(s), delay);
  }

  function attempt(s) {
    if (s !== session || s.closed) return;
    if (s.tries >= MAX_TRIES) {
      fail(s, { code: 'TIMEOUT', message: 'Could not reach the game. Check your connection and try again.' });
      return;
    }
    s.tries += 1;
    if (s.stage === 'joining') {
      publishJson(s.client, `/app/game/${s.roomCode}/join`, {
        nickname: s.nickname,
        reconnectToken: s.reconnectToken || null,
      });
    } else {
      publishJson(s.client, `/app/game/${s.roomCode}/sync`);
    }
    s.timer = setTimeout(() => attempt(s), RETRY_MS);
  }

  function onJoinAck(s, ack) {
    if (s !== session || s.stage !== 'joining') return; // duplicate ack from a retry
    s.reconnectToken = ack.reconnectToken;
    savePlayerSession({
      roomCode: s.roomCode,
      nickname: ack.nickname,
      reconnectToken: ack.reconnectToken,
      playerId: ack.playerId,
    });
    dispatch({ type: 'ME', me: ack });
    s.stage = 'syncing';
    schedule(s, 0);
  }

  function onSync(s, sync) {
    if (s !== session) return;
    clearTimeout(s.timer);
    if (s.role === 'HOST' && sync.role !== 'HOST') {
      fail(s, { code: 'NOT_HOST', message: 'That game belongs to another host.' });
      return;
    }
    if (s.role === 'PLAYER' && sync.role !== 'PLAYER') {
      fail(s, { code: 'NOT_IN_GAME', message: 'You are no longer in this game.' });
      return;
    }
    dispatch({ type: 'SYNC', sync });
    const firstTime = !s.ready;
    s.ready = true;
    s.stage = 'ready';
    dispatch({ type: 'CONNECTION', connection: 'connected' });
    if (firstTime) s.resolve({ role: sync.role });
  }

  function onError(s, error) {
    if (s !== session) return;
    if (!s.ready || FATAL_ANY_TIME.has(error.code)) {
      fail(s, error);
      return;
    }
    if (ANSWER_ERRORS.has(error.code)) {
      dispatch({ type: 'ANSWER_REJECTED', code: error.code });
    }
    dispatch({ type: 'ERROR', error, fatal: false });
  }

  function onKicked(s) {
    if (s !== session) return;
    clearPlayerSession();
    dispatch({ type: 'KICKED' });
    destroy(s);
    session = null;
  }

  // ----- public actions ---------------------------------------------------

  function send(action, body) {
    if (!session?.ready) return false;
    return publishJson(session.client, `/app/game/${session.roomCode}/${action}`, body);
  }

  return {
    enterAsHost: (roomCode, token) => start({ role: 'HOST', roomCode, token }),

    joinRoom(roomCode, nickname) {
      const saved = loadPlayerSession();
      const reconnectToken = saved && saved.roomCode === roomCode ? saved.reconnectToken : null;
      return start({ role: 'PLAYER', roomCode, nickname, reconnectToken });
    },

    resumePlayer(roomCode) {
      const saved = loadPlayerSession();
      if (!saved || saved.roomCode !== roomCode) {
        return Promise.reject({ code: 'NO_SESSION', message: 'Enter your nickname to join this game.' });
      }
      return start({
        role: 'PLAYER',
        roomCode,
        nickname: saved.nickname,
        reconnectToken: saved.reconnectToken,
      });
    },

    leave: () => leave(),

    startGame: () => send('start'),
    revealNow: () => send('reveal'),
    nextQuestion: () => send('next'),
    endGame: () => send('end'),
    kickPlayer: (playerId) => send('kick', { playerId }),

    submitAnswer(optionIndex) {
      const state = getState();
      const s = session;
      if (!s?.ready || state.phase !== 'QUESTION' || !state.question) return false;
      const questionIndex = state.question.questionIndex;
      if (state.myChoice || s.answeredQuestion === questionIndex) return false; // one answer only

      s.answeredQuestion = questionIndex;
      dispatch({ type: 'MY_ANSWER', optionIndex });
      const sent = send('answer', { questionIndex, optionIndex });
      if (!sent) {
        s.answeredQuestion = null;
        dispatch({ type: 'ANSWER_REJECTED', code: 'OFFLINE' });
        dispatch({
          type: 'ERROR',
          error: { code: 'OFFLINE', message: 'Connection lost. Reconnecting, then try again.' },
          fatal: false,
        });
      }
      return sent;
    },

    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  };
}