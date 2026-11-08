# Qontrol live-game protocol

Transport: **STOMP over SockJS** at `{API}/ws` (e.g. `http://localhost:8080/ws`).

| Direction | Destination | Who |
|---|---|---|
| client → server | `/app/game/{roomCode}/<action>` | see actions below |
| server → everyone in room | `/topic/room/{roomCode}` | all subscribers |
| server → one client | `/user/queue/<name>` | only the sender / target |

## Auth
* **Host**: send `Authorization: Bearer <jwt>` as a STOMP **connect header**. An invalid/expired
  token makes the CONNECT fail (re-login). Host actions check that the JWT user owns the room.
* **Player**: connect with no header. No account needed.

## Order of operations (important)
1. Host: `POST /api/games {quizId}` → `{ roomCode, quizTitle, questionCount }`
2. Anyone: `GET /api/games/{roomCode}/status` (public) → `{ state, playerCount, quizTitle }` — use on the join screen.
3. Connect STOMP, then **subscribe first**, *then* send (the web client also waits ~150 ms and resends `join`/`sync` until answered, because frames can overtake each other on the server; both are idempotent):
   `/topic/room/{code}`, `/user/queue/join`, `/user/queue/sync`, `/user/queue/errors`,
   `/user/queue/answer-ack`, `/user/queue/answer-result`, `/user/queue/kicked`.
   (Private replies are only delivered to subscriptions that already exist.)
4. Send `/app/game/{code}/sync` right after subscribing — returns the current state, so refresh / reconnect just works.

## Client → server actions
| Action | Body | Who | Notes |
|---|---|---|---|
| `join` | `{ nickname, reconnectToken? }` | player | pass the saved `reconnectToken` to rejoin mid-game |
| `answer` | `{ questionIndex, optionIndex }` | player | one answer per question |
| `sync` | – | anyone | replies on `/user/queue/sync` |
| `start` | – | host | needs ≥1 player |
| `reveal` | – | host | end the question early |
| `next` | – | host | after a reveal: next question, or final results |
| `kick` | `{ playerId }` | host | lobby only |
| `end` | – | host | cancels the room for everybody |

## Broadcast events (`/topic/room/{code}`) — envelope `{ type, data }`
State flow: `LOBBY → QUESTION → REVEAL → (QUESTION → REVEAL)* → FINISHED`

| type | data |
|---|---|
| `LOBBY_UPDATE` | `{ roomCode, quizTitle, players:[{id,nickname,connected}] }` |
| `QUESTION` | `{ questionIndex, totalQuestions, text, imageUrl, options:[{index,text}], timeLimitSeconds, points, startedAtMs, endsAtMs, serverNowMs }` — **never** includes the correct answer |
| `ANSWER_COUNT` | `{ questionIndex, answered, totalPlayers }` |
| `REVEAL` | `{ questionIndex, correctOptionIndex, optionCounts:[n…], leaderboard:[top 5], last }` |
| `FINISHED` | `{ quizTitle, totalQuestions, leaderboard:[all players] }` |
| `CANCELLED` | `{ reason }` |

Leaderboard entry: `{ rank, playerId, nickname, score, gained, correctCount }` (ties share a rank).

**Countdown**: compute `offset = serverNowMs - Date.now()` once, then show `endsAtMs - (Date.now() + offset)`.
The server owns the real clock and auto-reveals ~0.5 s after `endsAtMs`.

## Private messages (`/user/queue/...`)
| queue | data |
|---|---|
| `join` | `{ roomCode, playerId, reconnectToken, nickname }` — **store `reconnectToken`** (sessionStorage) |
| `answer-ack` | `{ questionIndex }` — "answer received" (does not say if it was right) |
| `answer-result` | `{ questionIndex, answered, correct, pointsAwarded, totalScore, rank }` — sent at reveal |
| `sync` | `{ role: HOST\|PLAYER\|SPECTATOR, me, event, lastResult, answeredOption, question, serverNowMs }` — `event` is the latest broadcast; `question` is the question on screen (so a refresh during REVEAL can redraw it); `answeredOption` is the option this player picked, during QUESTION and REVEAL |
| `kicked` | `{ code, message }` |
| `errors` | `{ code, message }` |

Error codes: `ROOM_NOT_FOUND, INVALID_NICKNAME, NICKNAME_TAKEN, ROOM_FULL, GAME_IN_PROGRESS, ALREADY_JOINED,
REJOIN_FAILED, NOT_IN_GAME, NOT_HOST, INVALID_STATE, NO_PLAYERS, ANSWER_CLOSED, STALE_QUESTION,
ALREADY_ANSWERED, INVALID_OPTION, INVALID_MESSAGE`

## Scoring
`points = base × (1 − (elapsed / timeLimit) / 2)` → full points if instant, half points at the buzzer, 0 if wrong.
Computed on the server from its own clock. Scores are applied at reveal, not when the answer is received.

## Known limits (v1)
* State is in memory: restarting the backend drops live games (Redis is the planned fix — everything goes through `GameRegistry`).
* Single backend instance only (the simple in-memory STOMP broker is not clustered).
* If the host disconnects mid-game the game pauses at the next reveal until they reconnect and `sync`.