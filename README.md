# Qontrol: a live multiplayer quiz platform

A real-time quiz game in the spirit of Kahoot. A host builds a quiz and opens a room, players join from their phones with a 6-digit PIN (no account needed), everyone answers against the clock, and speed-weighted scores climb a live leaderboard to a final podium.

Built as a full-stack project to explore real-time systems: WebSockets, server-authoritative game state, and reconnect handling.


## Live demo

**Play it:** https://qontrol-virid.vercel.app

1. Open the link and choose **Host login** → **Register as host**, then build a quiz and click **Host live**.
2. On your phone, scan the QR code (or open the join link) and pick a nickname.

> The backend runs on a free tier that goes to sleep when idle, so the **first request can take up to a minute**. Open the site once before showing it to anyone. Games in progress are lost if the free server restarts.

---

## Features

**Hosts**
- Sign up / log in (JWT)
- Quiz builder with a live **preview** of exactly what players will see
- One click on **Host live** opens a lobby with a big PIN, a QR code, and a player list with remove buttons
- Run the game: question timer, live answer counter, reveal with vote counts, top-5 leaderboard, final podium

**Players**
- Join with a PIN and a nickname, no account
- Four answer tiles, each with its own colour **and shape** (works for colour-blind players)
- A live "worth N points right now" counter that shrinks as time runs out
- Refresh the page or lose Wi-Fi mid-game and you land back where you were, with your score intact

**Under the hood**
- The **server owns the clock and the scoring**. Clients only display a countdown, so a modified browser cannot award itself points
- The correct answer is never sent to players before the reveal
- Rate limiting on login, PIN lookups and joins; input validation; consistent JSON error responses
- Sound effects are synthesised in the browser (Web Audio), so there are no audio files to ship

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 4, Framer Motion, React Router |
| Real-time | STOMP over SockJS (`@stomp/stompjs`, `sockjs-client`) |
| Backend | Spring Boot 4.1 (Java 21), Spring Security + JWT, Spring WebSocket |
| Database | PostgreSQL (quizzes and users) |
| Live game state | In memory (see *Limitations*) |

---

## How a game works

```
Host browser ──REST──▶ Spring Boot ──▶ PostgreSQL        (accounts, quizzes)
     │
     │  STOMP / WebSocket                (everything live)
     ▼
Spring Boot  ◀── STOMP ──  Player browsers (anonymous)
  GameService: the state machine, timer and scoring
```

`LOBBY → QUESTION → REVEAL → (QUESTION → REVEAL)* → FINISHED`

Everyone in a room subscribes to `/topic/room/{PIN}`; the server broadcasts typed events (`QUESTION`, `REVEAL`, `FINISHED`, ...). Private results go to one player over `/user/queue/...`. The full message contract is in [`quiz-backend/GAME_PROTOCOL.md`](quiz-backend/GAME_PROTOCOL.md).

**Scoring:** `points = base × (1 − (time used ÷ time limit) ÷ 2)`. Instant correct answer = full points, last-second correct answer = half, wrong or no answer = 0.

---

## Project structure

```
Qontrol/
├── src/                      React app
│   ├── pages/                Landing, Login, Dashboard, QuizBuilder, and the game screens
│   ├── components/game/      Answer tiles, countdown ring, leaderboard, podium...
│   ├── context/              Game state (reducer) + the shared socket provider
│   ├── services/             REST calls + gameClient.js (connect / join / sync / reconnect)
│   └── hooks, utils/        Countdown, scoring helpers, sound
├── quiz-backend/            Spring Boot API + WebSocket server
│   └── src/main/java/com/quizapp/
│       ├── controller, service, entity, dto, repository   quiz + auth CRUD
│       ├── security/        JWT filter, rate limiting, startup checks
│       └── game/            live-game engine (config, controller, model, service)
└── scripts/ws-smoke-test.mjs   plays a whole game against a running backend
```

---

## Getting started

**Prerequisites:** Java 21, Node 18+, PostgreSQL (or Docker).

### 1. Database
```bash
docker run --name quizdb -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=quizapp -p 5432:5432 -d postgres
```

### 2. Backend
```bash
cd quiz-backend
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run
```
Runs on `http://localhost:8080`. The defaults work with the Docker command above; override them with the environment variables below.

### 3. Frontend
```bash
# in the project root
npm install
cp .env.example .env.local      # VITE_API_URL=http://localhost:8080
npm run dev
```
Runs on `http://localhost:5173`.

### 4. Play
1. Register as a host, create a quiz, click **Host live**.
2. Open the join link (or scan the QR code) on your phone, or in a second browser window, and pick a nickname.
3. Press **Start game** on the host screen.

---

## Configuration

All backend settings are environment variables with development defaults (see `application.properties`).

| Variable | Default | Purpose |
|---|---|---|
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | local Postgres | Database |
| `JWT_SECRET` | dev-only value | **Set this when deploying** (at least 32 chars). With `SPRING_PROFILES_ACTIVE=prod` the app refuses to start on the dev default |
| `JWT_EXPIRATION` | `86400000` (24 h) | Token lifetime in ms |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated frontend origins (REST and WebSocket) |
| `DDL_AUTO` | `update` | Use `validate` once you manage the schema yourself |
| `SHOW_SQL` | `false` | Log SQL while debugging |
| `FORWARD_HEADERS_STRATEGY` | `none` | Set to `native` behind a reverse proxy so rate limits see real visitor IPs |
| `RATE_LIMIT_AUTH_PER_MIN` | `20` | Login/register attempts per IP |
| `RATE_LIMIT_STATUS_PER_MIN` | `120` | PIN lookups per IP |
| `RATE_LIMIT_JOIN_PER_MIN` | `200` | Join messages per IP (high on purpose: a classroom shares one IP) |

Frontend: `VITE_API_URL` (the backend URL).

---

## Testing

```bash
cd quiz-backend && ./mvnw test      # unit tests: scoring, game engine, rate limiter, security checks
```
`QuizBackendApplicationTests` (context loads) needs the database running; the others need nothing.

End-to-end against a running backend:
```bash
node scripts/ws-smoke-test.mjs      # registers a host, builds a quiz, plays a full game with two bots
```

---

## Security notes

- Passwords are hashed with BCrypt; hosts authenticate with a signed JWT.
- Quizzes (which contain the answers) can only be read by their owner.
- Players are anonymous. Their identity is a secret reconnect token issued on join, stored in the tab's `sessionStorage`.
- Login, register, PIN lookup and join are rate limited; error responses never include stack traces or SQL.
- Before deploying: set `JWT_SECRET`, set `CORS_ALLOWED_ORIGINS` to your real frontend URL, and set `FORWARD_HEADERS_STRATEGY=native` if you are behind a proxy.

## Deploying

The live demo runs on free tiers, and the whole setup costs nothing:

| Part | Host | Notes |
|---|---|---|
| Frontend (static React build) | Vercel | `vercel.json` rewrites every path to `index.html` so links like `/join/123456` survive a refresh. Set `VITE_API_URL` to the backend URL |
| Backend (Spring Boot, Docker) | Render | Root directory `quiz-backend`, uses `quiz-backend/Dockerfile`. Health check: `/api/health` |
| Database | Neon (PostgreSQL) | Use the direct (non-pooled) connection string as `jdbc:postgresql://HOST/DB?sslmode=require`, with the username and password in their own variables |

Backend environment variables for a deployment: `SPRING_PROFILES_ACTIVE=prod`, `JWT_SECRET`, `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD`, `CORS_ALLOWED_ORIGINS` (your exact frontend URL, no trailing slash) and `FORWARD_HEADERS_STRATEGY=native`. See *Configuration* above for the full list.

Run **one** backend instance only: live game state is in memory. For a classroom or event, a paid always-on instance avoids the free tier's sleep and restarts.

---

## Limitations

- Live games are kept **in memory** on one backend instance. Restarting the backend ends running games, and you cannot run several instances yet. Moving `GameRegistry` to Redis is the planned fix.
- If the host closes their tab mid-game, play pauses at the next reveal until they reopen the same `/host/<PIN>` link.
- Free hosting tiers that sleep when idle will drop a running game.

---

## Roadmap

- [x] Host auth and quiz CRUD
- [x] Real-time rooms: join by PIN, lobby, live questions
- [x] Server-side speed scoring, live leaderboard, final podium
- [x] Reconnect and refresh handling
- [x] Sound effects, QR join, mobile-first player screen
- [x] Rate limiting, validation, clean error responses
- [x] Deployed (Vercel + Render + Neon)
- [ ] Redis-backed game state (multiple instances)
- [ ] Public quiz library
- [ ] More question types (true/false, image, type-the-answer)
- [ ] Team mode
- [ ] Post-game analytics (which questions tripped people up)
- [ ] Docker Compose for one-command setup

---

## Contributors

- **Md. Fahim Hassan**: Frontend (React)
- **Shahriar Islam Tawsif**: Backend (Spring Boot)