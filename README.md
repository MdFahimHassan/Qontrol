#  Qontrol - A Multiplayer Quiz Platform

A real-time multiplayer quiz game inspired by Kahoot — hosts create quizzes and launch live game sessions, players join with a room code, and everyone competes in real time with speed-based scoring and a live leaderboard.

Built as a full-stack passion project to explore real-time systems, WebSockets, and full-stack architecture — with no deadline, just steady iteration.

---

##  Features

-  Host authentication (JWT-based)
-  Quiz builder — create quizzes with multiple questions and options
-  Room codes — players join instantly, no account needed
-  Real-time gameplay via WebSockets (STOMP over SockJS)
-  Countdown-based, speed-weighted scoring
-  Live leaderboard between rounds + final podium
-  Mobile-responsive player view (join from your phone)
-  QR code join support

---

##  Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS
- `@stomp/stompjs` + `sockjs-client` for real-time communication
- Framer Motion for animations

**Backend**
- Spring Boot 3.x
- Spring Security (JWT)
- Spring WebSocket (STOMP)
- Spring Data JPA + PostgreSQL
- Redis *(planned — for scalable room state)*

---

##  Architecture

```
Host Browser ──REST──▶ Spring Boot API ──▶ PostgreSQL
     │  ▲
     │  │  WebSocket (start game, next question)
     ▼  │
Player Browser ──WebSocket (join, submit answer)──▶ Spring Boot API ──▶ Redis (room state)
```

Everyone connected to a game session subscribes to a room-specific topic (`/topic/room/{roomCode}`). The server broadcasts questions, leaderboard updates, and game state changes to all subscribers in that room simultaneously.

---

##  Project Structure

```
quiz-platform/
├── backend/     → Spring Boot API + WebSocket server
└── frontend/    → React client (host + player views)
```

See `/backend/README.md` and `/frontend/README.md` for setup specific to each app.

---

##  Getting Started

### Prerequisites
- Java 21+
- Node.js 18+
- PostgreSQL (or Docker)

### Backend
```bash
cd backend
# configure src/main/resources/application.yml with your DB credentials
mvn spring-boot:run
```
Runs at `http://localhost:8080`

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:8080
npm run dev
```
Runs at `http://localhost:5173`

---

##  Roadmap

- [x] Auth + quiz CRUD
- [x] Real-time room join + question broadcast
- [x] Speed-based scoring + live leaderboard
- [ ] Polished UI, sounds, QR join
- [ ] Public quiz library
- [ ] Team mode
- [ ] Redis-backed room state for scaling
- [ ] Post-game analytics for hosts

---

##  Contributors

- **Md. Fahim Hassan** — Frontend (React)
- **Shahriar Islam Tawsif** — Backend (Spring Boot)
