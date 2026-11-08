package com.quizapp.game.service;

import com.quizapp.dto.response.OptionResponse;
import com.quizapp.dto.response.QuestionResponse;
import com.quizapp.dto.response.QuizResponse;
import com.quizapp.entity.User;
import com.quizapp.game.GameDtos.AnswerAck;
import com.quizapp.game.GameDtos.AnswerCountData;
import com.quizapp.game.GameDtos.AnswerRequest;
import com.quizapp.game.GameDtos.AnswerResult;
import com.quizapp.game.GameDtos.CancelledData;
import com.quizapp.game.GameDtos.CreateGameResponse;
import com.quizapp.game.GameDtos.ErrorEvent;
import com.quizapp.game.GameDtos.FinishedData;
import com.quizapp.game.GameDtos.GameEvent;
import com.quizapp.game.GameDtos.GameStatusResponse;
import com.quizapp.game.GameDtos.JoinAck;
import com.quizapp.game.GameDtos.JoinRequest;
import com.quizapp.game.GameDtos.LeaderboardEntry;
import com.quizapp.game.GameDtos.LobbyData;
import com.quizapp.game.GameDtos.OptionData;
import com.quizapp.game.GameDtos.PlayerInfo;
import com.quizapp.game.GameDtos.QuestionData;
import com.quizapp.game.GameDtos.RevealData;
import com.quizapp.game.GameDtos.SyncData;
import com.quizapp.game.GameException;
import com.quizapp.game.model.GameOption;
import com.quizapp.game.model.GameQuestion;
import com.quizapp.game.model.GameSession;
import com.quizapp.game.model.GameState;
import com.quizapp.game.model.Player;
import com.quizapp.game.model.PlayerAnswer;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * The live-game engine. The SERVER is the single source of truth:
 *  - it owns the clock (clients only display a countdown),
 *  - it computes scores,
 *  - it never sends the correct answer before the reveal phase.
 *
 * Concurrency: every mutation of a session happens inside synchronized (session).
 * The scheduler thread (auto-reveal) and STOMP threads therefore never interleave.
 */
@Service
public class GameService {

    private static final Logger log = LoggerFactory.getLogger(GameService.class);

    // Event types sent on /topic/room/{code}
    public static final String LOBBY_UPDATE = "LOBBY_UPDATE";
    public static final String QUESTION = "QUESTION";
    public static final String ANSWER_COUNT = "ANSWER_COUNT";
    public static final String REVEAL = "REVEAL";
    public static final String FINISHED = "FINISHED";
    public static final String CANCELLED = "CANCELLED";

    private static final int MAX_PLAYERS = 200;
    private static final int REVEAL_LEADERBOARD_SIZE = 5;
    /** Network grace: an answer that arrives this long after the deadline still counts. */
    private static final long ANSWER_GRACE_MS = 500;
    private static final long IDLE_TIMEOUT_MS = TimeUnit.HOURS.toMillis(3);
    private static final long FINISHED_TIMEOUT_MS = TimeUnit.MINUTES.toMillis(30);

    private final GameRegistry registry;
    private final SimpMessagingTemplate messaging;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    public GameService(GameRegistry registry, SimpMessagingTemplate messaging) {
        this.registry = registry;
        this.messaging = messaging;
    }

    @PostConstruct
    void startCleanupJob() {
        scheduler.scheduleWithFixedDelay(this::cleanupStaleGames, 1, 1, TimeUnit.MINUTES);
    }

    @PreDestroy
    void shutdown() {
        scheduler.shutdownNow();
    }

    // =====================================================================
    // REST-facing
    // =====================================================================

    public CreateGameResponse createGame(QuizResponse quiz, User host) {
        if (quiz.getQuestions() == null || quiz.getQuestions().isEmpty()) {
            throw new GameException("EMPTY_QUIZ", "This quiz has no questions yet");
        }
        List<GameQuestion> questions = new ArrayList<>();
        int number = 0;
        for (QuestionResponse q : quiz.getQuestions()) {
            questions.add(toGameQuestion(q, ++number));
        }

        GameSession session = registry.create(code ->
                new GameSession(code, host.getId(), quiz.getId(), quiz.getTitle(), questions));
        synchronized (session) {
            session.setLastEvent(new GameEvent(LOBBY_UPDATE, lobbyData(session)));
        }
        log.info("Game {} created for quiz {} by user {}", session.getRoomCode(), quiz.getId(), host.getId());
        return new CreateGameResponse(session.getRoomCode(), quiz.getTitle(), questions.size());
    }

    public GameStatusResponse status(String roomCode) {
        GameSession session = registry.require(roomCode);
        synchronized (session) {
            return new GameStatusResponse(session.getRoomCode(), session.getState().name(),
                    session.getQuizTitle(), session.playerCount());
        }
    }

    private GameQuestion toGameQuestion(QuestionResponse q, int number) {
        List<GameOption> options = new ArrayList<>();
        int correct = 0;
        List<OptionResponse> source = q.getOptions() == null ? List.of() : q.getOptions();
        for (int i = 0; i < source.size(); i++) {
            boolean isCorrect = Boolean.TRUE.equals(source.get(i).getIsCorrect());
            if (isCorrect) correct++;
            options.add(new GameOption(i, source.get(i).getOptionText(), isCorrect));
        }
        if (options.size() < 2 || correct != 1) {
            throw new GameException("INVALID_QUIZ", "Question " + number
                    + " needs at least 2 options and exactly one correct answer. Edit and re-save the quiz.");
        }
        int limit = q.getTimeLimitSeconds() != null ? q.getTimeLimitSeconds() : 20;
        int points = q.getPoints() != null ? q.getPoints() : 1000;
        return new GameQuestion(q.getId(), q.getQuestionText(), q.getImageUrl(), limit, points,
                List.copyOf(options));
    }

    // =====================================================================
    // Player actions
    // =====================================================================

    public void join(String roomCode, String connId, JoinRequest request) {
        GameSession session = registry.require(roomCode);
        synchronized (session) {
            session.touch();

            // --- reconnect with the secret token we handed out earlier ---
            String token = request == null ? null : request.reconnectToken();
            if (token != null && !token.isBlank()) {
                Player existing = session.findPlayerByToken(token);
                if (existing != null) {
                    if (existing.getConnectionId() != null && !existing.getConnectionId().equals(connId)) {
                        registry.unbind(existing.getConnectionId());
                    }
                    existing.setConnectionId(connId);
                    existing.setConnected(true);
                    registry.bind(connId, roomCode);
                    sendPrivate(connId, "/queue/join", ack(session, existing));
                    if (session.getState() == GameState.LOBBY) {
                        broadcastLobby(session);
                    }
                    return;
                }
                if (session.getState() != GameState.LOBBY) {
                    throw new GameException("REJOIN_FAILED", "Could not rejoin this game");
                }
                // In the lobby a disconnected player is removed, so just fall through and join fresh.
            }

            if (session.getState() != GameState.LOBBY) {
                throw new GameException("GAME_IN_PROGRESS", "This game has already started");
            }
            if (registry.roomOf(connId) != null) {
                throw new GameException("ALREADY_JOINED", "You are already in a game");
            }
            String nickname = GameLogic.normalizeNickname(request == null ? null : request.nickname());
            if (session.nicknameTaken(nickname)) {
                throw new GameException("NICKNAME_TAKEN", "That nickname is already taken");
            }
            if (session.playerCount() >= MAX_PLAYERS) {
                throw new GameException("ROOM_FULL", "This game is full");
            }

            Player player = new Player(shortId(), UUID.randomUUID().toString(), nickname, connId);
            session.addPlayer(player);
            registry.bind(connId, roomCode);

            sendPrivate(connId, "/queue/join", ack(session, player));
            broadcastLobby(session);
        }
    }

    public void submitAnswer(String roomCode, String connId, AnswerRequest request) {
        GameSession session = registry.require(roomCode);
        synchronized (session) {
            session.touch();
            Player player = session.findPlayerByConnection(connId);
            if (player == null) {
                throw new GameException("NOT_IN_GAME", "You are not a player in this game");
            }
            if (request == null) {
                throw new GameException("INVALID_MESSAGE", "Missing answer");
            }
            if (session.getState() != GameState.QUESTION) {
                throw new GameException("ANSWER_CLOSED", "No question is open right now");
            }
            if (request.questionIndex() != session.getCurrentQuestionIndex()) {
                throw new GameException("STALE_QUESTION", "That question is already over");
            }
            if (session.getCurrentAnswers().containsKey(player.getId())) {
                throw new GameException("ALREADY_ANSWERED", "You already answered this question");
            }

            GameQuestion question = session.currentQuestion();
            if (request.optionIndex() < 0 || request.optionIndex() >= question.options().size()) {
                throw new GameException("INVALID_OPTION", "That option does not exist");
            }

            long now = System.currentTimeMillis();
            if (now > session.getQuestionEndsAtMs() + ANSWER_GRACE_MS) {
                throw new GameException("ANSWER_CLOSED", "Time is up");
            }

            long elapsed = Math.max(0L, now - session.getQuestionStartedAtMs());
            boolean correct = question.options().get(request.optionIndex()).correct();
            int points = correct
                    ? GameLogic.calculatePoints(question.points(), elapsed, question.timeLimitSeconds())
                    : 0;
            session.getCurrentAnswers().put(player.getId(),
                    new PlayerAnswer(request.optionIndex(), elapsed, correct, points));

            // Only confirm "received" — never say whether it was right before the reveal.
            sendPrivate(connId, "/queue/answer-ack", new AnswerAck(session.getCurrentQuestionIndex()));
            broadcast(session, new GameEvent(ANSWER_COUNT, new AnswerCountData(
                    session.getCurrentQuestionIndex(), session.getCurrentAnswers().size(), session.playerCount())));

            if (allConnectedPlayersAnswered(session)) {
                reveal(session);
            }
        }
    }

    // =====================================================================
    // Host actions
    // =====================================================================

    public void startGame(String roomCode, Long userId) {
        GameSession session = registry.require(roomCode);
        synchronized (session) {
            requireHost(session, userId);
            session.touch();
            if (session.getState() != GameState.LOBBY) {
                throw new GameException("INVALID_STATE", "The game has already started");
            }
            if (session.playerCount() == 0) {
                throw new GameException("NO_PLAYERS", "Wait for at least one player to join");
            }
            startQuestion(session, 0);
        }
    }

    /** Host ends the current question early. */
    public void revealNow(String roomCode, Long userId) {
        GameSession session = registry.require(roomCode);
        synchronized (session) {
            requireHost(session, userId);
            session.touch();
            if (session.getState() != GameState.QUESTION) {
                throw new GameException("INVALID_STATE", "No question is open");
            }
            reveal(session);
        }
    }

    /** Host moves on from the reveal screen: next question, or the final results. */
    public void nextQuestion(String roomCode, Long userId) {
        GameSession session = registry.require(roomCode);
        synchronized (session) {
            requireHost(session, userId);
            session.touch();
            if (session.getState() != GameState.REVEAL) {
                throw new GameException("INVALID_STATE", "Finish the current question first");
            }
            int next = session.getCurrentQuestionIndex() + 1;
            if (next >= session.getQuestions().size()) {
                finish(session);
            } else {
                startQuestion(session, next);
            }
        }
    }

    /** Host closes the room. Everyone is told, then the session is dropped. */
    public void endGame(String roomCode, Long userId) {
        GameSession session = registry.require(roomCode);
        synchronized (session) {
            requireHost(session, userId);
            session.cancelTimer();
            broadcast(session, new GameEvent(CANCELLED, new CancelledData("The host ended the game")));
            registry.remove(roomCode);
        }
        log.info("Game {} ended by host", roomCode);
    }

    /** Host removes a player — lobby only. */
    public void kick(String roomCode, Long userId, String playerId) {
        GameSession session = registry.require(roomCode);
        synchronized (session) {
            requireHost(session, userId);
            session.touch();
            if (session.getState() != GameState.LOBBY) {
                throw new GameException("INVALID_STATE", "Players can only be removed in the lobby");
            }
            Player removed = session.removePlayer(playerId);
            if (removed == null) {
                throw new GameException("PLAYER_NOT_FOUND", "That player is not in the game");
            }
            registry.unbind(removed.getConnectionId());
            sendPrivate(removed.getConnectionId(), "/queue/kicked",
                    new ErrorEvent("KICKED", "The host removed you from the game"));
            broadcastLobby(session);
        }
    }

    // =====================================================================
    // Everyone: resync after a refresh / reconnect
    // =====================================================================

    public void sync(String roomCode, String connId, Long userId) {
        GameSession session = registry.require(roomCode);
        synchronized (session) {
            session.touch();
            boolean host = userId != null && userId.equals(session.getHostUserId());
            Player player = host ? null : session.findPlayerByConnection(connId);
            String role = host ? "HOST" : (player != null ? "PLAYER" : "SPECTATOR");

            Integer answeredOption = null;
            if (player != null && session.getState() == GameState.QUESTION) {
                PlayerAnswer answer = session.getCurrentAnswers().get(player.getId());
                if (answer != null) answeredOption = answer.optionIndex();
            }
            sendPrivate(connId, "/queue/sync", new SyncData(role,
                    player == null ? null : ack(session, player),
                    session.getLastEvent(),
                    player == null ? null : player.getLastResult(),
                    answeredOption,
                    System.currentTimeMillis()));
        }
    }

    // =====================================================================
    // Disconnects
    // =====================================================================

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        Principal user = event.getUser();
        if (user == null) return;
        String connId = user.getName();
        String roomCode = registry.roomOf(connId);
        if (roomCode == null) return;

        registry.find(roomCode).ifPresent(session -> {
            synchronized (session) {
                Player player = session.findPlayerByConnection(connId);
                registry.unbind(connId);
                if (player == null) return; // already replaced by a newer connection

                if (session.getState() == GameState.LOBBY) {
                    session.removePlayer(player.getId());
                    broadcastLobby(session);
                } else {
                    // Keep their score; they can come back with their reconnect token.
                    player.setConnected(false);
                    if (session.getState() == GameState.QUESTION && allConnectedPlayersAnswered(session)) {
                        reveal(session);
                    }
                }
            }
        });
    }

    // =====================================================================
    // Internals — all of these assume the caller holds synchronized (session)
    // =====================================================================

    private void startQuestion(GameSession session, int index) {
        GameQuestion q = session.getQuestions().get(index);
        long now = System.currentTimeMillis();
        long limitMs = q.timeLimitSeconds() * 1000L;
        session.beginQuestion(index, now, now + limitMs);

        List<OptionData> options = new ArrayList<>();
        for (GameOption o : q.options()) {
            options.add(new OptionData(o.index(), o.text())); // NOTE: no `correct` flag
        }
        publish(session, new GameEvent(QUESTION, new QuestionData(index, session.getQuestions().size(),
                q.text(), q.imageUrl(), options, q.timeLimitSeconds(), q.points(),
                now, now + limitMs, now)));

        final String roomCode = session.getRoomCode();
        session.setTimer(scheduler.schedule(() -> onTimerExpired(roomCode, index),
                limitMs + ANSWER_GRACE_MS, TimeUnit.MILLISECONDS));
    }

    private void onTimerExpired(String roomCode, int questionIndex) {
        try {
            registry.find(roomCode).ifPresent(session -> {
                synchronized (session) {
                    if (session.getState() == GameState.QUESTION
                            && session.getCurrentQuestionIndex() == questionIndex) {
                        reveal(session);
                    }
                }
            });
        } catch (Exception e) {
            // A scheduled task that throws is silently swallowed — make sure we see it.
            log.error("Auto-reveal failed for room {}", roomCode, e);
        }
    }

    private void reveal(GameSession session) {
        session.cancelTimer();
        session.setState(GameState.REVEAL);

        GameQuestion q = session.currentQuestion();
        int[] optionCounts = new int[q.options().size()];
        Map<String, Integer> gained = new HashMap<>();

        for (Player p : session.getPlayers()) {
            PlayerAnswer a = session.getCurrentAnswers().get(p.getId());
            if (a == null) continue;
            optionCounts[a.optionIndex()]++;
            if (a.correct()) {
                p.award(a.points());
                gained.put(p.getId(), a.points());
            }
        }

        List<LeaderboardEntry> full = GameLogic.buildLeaderboard(session.getPlayers(), gained);
        List<LeaderboardEntry> top = full.subList(0, Math.min(REVEAL_LEADERBOARD_SIZE, full.size()));
        boolean last = session.getCurrentQuestionIndex() == session.getQuestions().size() - 1;

        publish(session, new GameEvent(REVEAL, new RevealData(session.getCurrentQuestionIndex(),
                q.correctIndex(), optionCounts, List.copyOf(top), last)));

        // Each player privately learns how THEY did.
        Map<String, Integer> rankById = new HashMap<>();
        for (LeaderboardEntry e : full) rankById.put(e.playerId(), e.rank());
        for (Player p : session.getPlayers()) {
            PlayerAnswer a = session.getCurrentAnswers().get(p.getId());
            AnswerResult result = new AnswerResult(session.getCurrentQuestionIndex(), a != null,
                    a != null && a.correct(), gained.getOrDefault(p.getId(), 0), p.getScore(),
                    rankById.getOrDefault(p.getId(), full.size()));
            p.setLastResult(result);
            if (p.isConnected()) {
                sendPrivate(p.getConnectionId(), "/queue/answer-result", result);
            }
        }
    }

    private void finish(GameSession session) {
        session.cancelTimer();
        session.setState(GameState.FINISHED);
        List<LeaderboardEntry> board = GameLogic.buildLeaderboard(session.getPlayers(), Map.of());
        publish(session, new GameEvent(FINISHED,
                new FinishedData(session.getQuizTitle(), session.getQuestions().size(), board)));
    }

    private boolean allConnectedPlayersAnswered(GameSession session) {
        List<Player> connected = session.connectedPlayers();
        if (connected.isEmpty()) return false;
        for (Player p : connected) {
            if (!session.getCurrentAnswers().containsKey(p.getId())) return false;
        }
        return true;
    }

    private void requireHost(GameSession session, Long userId) {
        if (userId == null || !userId.equals(session.getHostUserId())) {
            throw new GameException("NOT_HOST", "Only the host can do that");
        }
    }

    private LobbyData lobbyData(GameSession session) {
        List<PlayerInfo> players = new ArrayList<>();
        for (Player p : session.getPlayers()) {
            players.add(new PlayerInfo(p.getId(), p.getNickname(), p.isConnected()));
        }
        return new LobbyData(session.getRoomCode(), session.getQuizTitle(), players);
    }

    private void broadcastLobby(GameSession session) {
        publish(session, new GameEvent(LOBBY_UPDATE, lobbyData(session)));
    }

    private JoinAck ack(GameSession session, Player player) {
        return new JoinAck(session.getRoomCode(), player.getId(), player.getReconnectToken(), player.getNickname());
    }

    /** Broadcast AND remember as the state a reconnecting client should see. */
    private void publish(GameSession session, GameEvent event) {
        session.setLastEvent(event);
        broadcast(session, event);
    }

    /** Broadcast only (transient events such as answer counts). */
    private void broadcast(GameSession session, GameEvent event) {
        messaging.convertAndSend("/topic/room/" + session.getRoomCode(), event);
    }

    private void sendPrivate(String connId, String destination, Object payload) {
        if (connId != null) {
            messaging.convertAndSendToUser(connId, destination, payload);
        }
    }

    private static String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    private void cleanupStaleGames() {
        try {
            long now = System.currentTimeMillis();
            for (GameSession session : registry.all()) {
                synchronized (session) {
                    long idle = now - session.getLastActivityMs();
                    boolean stale = idle > IDLE_TIMEOUT_MS
                            || (session.getState() == GameState.FINISHED && idle > FINISHED_TIMEOUT_MS);
                    if (stale) {
                        session.cancelTimer();
                        registry.remove(session.getRoomCode());
                        log.info("Removed stale game {}", session.getRoomCode());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Game cleanup failed", e);
        }
    }
}