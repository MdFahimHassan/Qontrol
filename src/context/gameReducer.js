// Pure state machine for one live game, as seen by one browser.
// No React, no sockets in here, so it can be unit-tested on its own.

export const initialGameState = {
  connection: 'idle', // idle | connecting | connected | reconnecting
  role: null, // HOST | PLAYER
  roomCode: null,
  me: null, // { playerId, reconnectToken, nickname } (players only)

  phase: null, // LOBBY | QUESTION | REVEAL | FINISHED | CANCELLED | KICKED
  order: -1, // monotonic position in the game; stale events are ignored

  quizTitle: '',
  players: [], // lobby list
  playerCount: 0,

  question: null, // current QUESTION payload
  answerCount: null, // { questionIndex, answered, totalPlayers }
  reveal: null, // REVEAL payload
  finished: null, // FINISHED payload

  myChoice: null, // { optionIndex, acked }
  myResult: null, // private AnswerResult for the revealed question
  myScore: 0, // running total, kept across questions
  myRank: null,

  clockOffset: 0, // serverNow - clientNow (ms)
  error: null, // { code, message }
  fatal: false, // true = this session is dead, leave the page
  endedReason: '',
};

// Where an event sits in the game. Lets a late `sync` reply never overwrite newer state.
function orderOf(event) {
  switch (event.type) {
    case 'LOBBY_UPDATE':
      return 0;
    case 'QUESTION':
      return event.data.questionIndex * 2 + 1;
    case 'REVEAL':
      return event.data.questionIndex * 2 + 2;
    case 'FINISHED':
      return 1e9;
    case 'CANCELLED':
      return 2e9;
    default:
      return null;
  }
}

function applyEvent(state, event, serverNowMs) {
  if (!event) return state;

  // Transient: not part of the ordered timeline.
  if (event.type === 'ANSWER_COUNT') {
    if (state.question && event.data.questionIndex === state.question.questionIndex) {
      return { ...state, answerCount: event.data };
    }
    return state;
  }

  const order = orderOf(event);
  if (order === null || order < state.order) return state;

  const data = event.data;
  switch (event.type) {
    case 'LOBBY_UPDATE':
      return {
        ...state,
        phase: 'LOBBY',
        order,
        quizTitle: data.quizTitle,
        players: data.players,
        playerCount: data.players.length,
      };

    case 'QUESTION': {
      const same = state.question && state.question.questionIndex === data.questionIndex;
      return {
        ...state,
        phase: 'QUESTION',
        order,
        question: data,
        reveal: null,
        answerCount: same
          ? state.answerCount
          : { questionIndex: data.questionIndex, answered: 0, totalPlayers: state.playerCount },
        myChoice: same ? state.myChoice : null,
        myResult: same ? state.myResult : null,
        clockOffset: (serverNowMs ?? data.serverNowMs) - Date.now(),
      };
    }

    case 'REVEAL':
      return { ...state, phase: 'REVEAL', order, reveal: data };

    case 'FINISHED':
      return {
        ...state,
        phase: 'FINISHED',
        order,
        finished: data,
        playerCount: data.leaderboard.length,
      };

    case 'CANCELLED':
      return { ...state, phase: 'CANCELLED', order, endedReason: data.reason };

    default:
      return state;
  }
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SESSION_START':
      return { ...initialGameState, role: action.role, roomCode: action.roomCode, connection: 'connecting' };

    case 'RESET':
      return initialGameState;

    case 'CONNECTION':
      return { ...state, connection: action.connection };

    case 'ME':
      return { ...state, me: action.me };

    case 'EVENT':
      return applyEvent(state, action.event);

    case 'SYNC': {
      const sync = action.sync;
      let next = { ...state, me: sync.me || state.me };
      next = applyEvent(next, sync.event, sync.serverNowMs);
      // During REVEAL the event carries no question text; the server sends it alongside.
      if (sync.question && (!next.question || next.question.questionIndex !== sync.question.questionIndex)) {
        next = { ...next, question: sync.question };
      }
      if (sync.lastResult) {
        next = { ...next, myScore: sync.lastResult.totalScore, myRank: sync.lastResult.rank };
        if (next.question && sync.lastResult.questionIndex === next.question.questionIndex) {
          next = { ...next, myResult: sync.lastResult };
        }
      }
      if (sync.answeredOption != null && (next.phase === 'QUESTION' || next.phase === 'REVEAL')) {
        next = { ...next, myChoice: { optionIndex: sync.answeredOption, acked: true } };
      }
      return next;
    }

    case 'MY_ANSWER':
      return { ...state, myChoice: { optionIndex: action.optionIndex, acked: false } };

    case 'ANSWER_ACK':
      if (state.myChoice && state.question && action.ack.questionIndex === state.question.questionIndex) {
        return { ...state, myChoice: { ...state.myChoice, acked: true } };
      }
      return state;

    case 'ANSWER_REJECTED':
      // The server already has our answer in this case, so keep showing it.
      return action.code === 'ALREADY_ANSWERED' ? state : { ...state, myChoice: null };

    case 'RESULT':
      return { ...state, myResult: action.result, myScore: action.result.totalScore, myRank: action.result.rank };

    case 'KICKED':
      return { ...state, phase: 'KICKED', order: 3e9 };

    case 'ERROR':
      return { ...state, error: action.error, fatal: !!action.fatal };

    case 'CLEAR_ERROR':
      return state.fatal ? state : { ...state, error: null };

    default:
      return state;
  }
}

// Which URL shows a given phase.
export function routeFor(role, roomCode, phase) {
  const base = role === 'HOST' ? `/host/${roomCode}` : `/play/${roomCode}`;
  switch (phase) {
    case 'LOBBY':
      return base;
    case 'QUESTION':
    case 'REVEAL':
      return `${base}/live`;
    case 'FINISHED':
      return `${base}/results`;
    case 'CANCELLED':
      return role === 'HOST' ? '/dashboard' : '/join';
    case 'KICKED':
      return '/join';
    default:
      return null;
  }
}

export function noticeFor(phase, endedReason) {
  if (phase === 'CANCELLED') return endedReason || 'The host ended the game.';
  if (phase === 'KICKED') return 'The host removed you from the game.';
  return '';
}