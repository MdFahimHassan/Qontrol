// End-to-end smoke test for the live-game backend — no UI needed.
//   1. start Postgres + backend   2. npm install   3. node scripts/ws-smoke-test.mjs
// Registers a throwaway host, builds a 2-question quiz, opens a room, joins two
// bots, plays the whole game and prints what each side receives.
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API = process.env.API_URL || 'http://localhost:8080';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (who, ...a) => console.log(`[${who}]`, ...a);

async function rest(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
}

function connect(name, token) {
  return new Promise((resolve, reject) => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API}/ws`),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 0,
      onConnect: () => resolve(client),
      onStompError: (f) => reject(new Error(`${name}: ${f.headers.message}`)),
    });
    client.activate();
  });
}

const sub = (client, dest, fn) => client.subscribe(dest, (m) => fn(JSON.parse(m.body)));
const send = (client, dest, body) =>
  client.publish({ destination: dest, body: body ? JSON.stringify(body) : '', headers: { 'content-type': 'application/json' } });

const suffix = Date.now().toString(36);
const auth = await rest('/api/auth/register', {
  method: 'POST',
  body: { username: `host_${suffix}`, email: `host_${suffix}@test.dev`, password: 'secret123' },
});
const token = auth.token;

const opt = (t, c) => ({ optionText: t, isCorrect: c });
const quiz = await rest('/api/quizzes', {
  method: 'POST', token,
  body: {
    title: 'Smoke Test Quiz',
    questions: [
      { questionText: '2 + 2 ?', timeLimitSeconds: 10, points: 1000, options: [opt('3', false), opt('4', true), opt('5', false), opt('22', false)] },
      { questionText: 'Capital of France?', timeLimitSeconds: 10, points: 1000, options: [opt('Paris', true), opt('Rome', false), opt('Oslo', false), opt('Bern', false)] },
    ],
  },
});
const { roomCode } = await rest('/api/games', { method: 'POST', token, body: { quizId: quiz.id } });
log('rest', 'room code', roomCode, await rest(`/api/games/${roomCode}/status`));

const room = `/topic/room/${roomCode}`;
const app = (a) => `/app/game/${roomCode}/${a}`;

// ---- host
const host = await connect('host', token);
sub(host, '/user/queue/errors', (e) => log('host', 'ERROR', e));
sub(host, room, (e) => log('host', e.type, e.type === 'QUESTION' ? e.data.text : e.type === 'LOBBY_UPDATE' ? e.data.players.map((p) => p.nickname) : e.type === 'ANSWER_COUNT' ? `${e.data.answered}/${e.data.totalPlayers}` : ''));
let hostState = null;
sub(host, room, (e) => (hostState = e));

// ---- two bots: Ann always right, Bo always picks option 3 (always wrong)
const bots = [];
for (const [nick, pick] of [['Ann', null], ['Bo', 3]]) {
  const c = await connect(nick, null);
  const bot = { nick, pick, client: c, correctByQuestion: [1, 0] };
  sub(c, '/user/queue/errors', (e) => log(nick, 'ERROR', e));
  sub(c, '/user/queue/join', (a) => log(nick, 'joined as', a.playerId));
  sub(c, '/user/queue/answer-result', (r) => log(nick, 'result', JSON.stringify(r)));
  sub(c, room, (e) => {
    if (e.type === 'QUESTION') {
      const idx = e.data.questionIndex;
      const choice = bot.pick ?? bot.correctByQuestion[idx];
      setTimeout(() => send(c, app('answer'), { questionIndex: idx, optionIndex: choice }), 300 + Math.random() * 400);
    }
  });
  bots.push(bot);
  send(c, app('join'), { nickname: nick });
  await sleep(200);
}

send(host, app('start'));
for (let q = 0; q < 2; q++) {
  // wait for REVEAL, then advance
  while (hostState?.type !== 'REVEAL') await sleep(100);
  log('host', 'REVEAL', JSON.stringify(hostState.data.leaderboard.map((l) => `${l.rank}. ${l.nickname} ${l.score}`)));
  hostState = null;
  send(host, app('next'));
  await sleep(300);
}
while (hostState?.type !== 'FINISHED') await sleep(100);
log('host', 'FINISHED', JSON.stringify(hostState.data.leaderboard.map((l) => `${l.rank}. ${l.nickname} ${l.score}`)));

await sleep(300);
[host, ...bots.map((b) => b.client)].forEach((c) => c.deactivate());
log('done', 'expected: Ann ~1800-2000 pts (rank 1), Bo 0 pts (rank 2).');
process.exit(0);
