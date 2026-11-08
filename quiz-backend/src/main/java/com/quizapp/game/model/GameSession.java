package com.quizapp.game.model;

import com.quizapp.game.GameDtos.GameEvent;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;

/**
 * All state of one live game. NOT thread-safe by itself: GameService always
 * does `synchronized (session)` around any read-modify-write.
 */
public class GameSession {

    private final String roomCode;
    private final Long hostUserId;
    private final Long quizId;
    private final String quizTitle;
    private final List<GameQuestion> questions;

    private final Map<String, Player> players = new LinkedHashMap<>();
    private final Map<String, PlayerAnswer> currentAnswers = new HashMap<>();

    private GameState state = GameState.LOBBY;
    private int currentQuestionIndex = -1;
    private long questionStartedAtMs;
    private long questionEndsAtMs;
    private ScheduledFuture<?> timer;
    private GameEvent lastEvent;
    private volatile long lastActivityMs = System.currentTimeMillis();

    public GameSession(String roomCode, Long hostUserId, Long quizId, String quizTitle,
                       List<GameQuestion> questions) {
        this.roomCode = roomCode;
        this.hostUserId = hostUserId;
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.questions = List.copyOf(questions);
    }

    // ----- identity -----
    public String getRoomCode() { return roomCode; }
    public Long getHostUserId() { return hostUserId; }
    public Long getQuizId() { return quizId; }
    public String getQuizTitle() { return quizTitle; }
    public List<GameQuestion> getQuestions() { return questions; }

    // ----- state machine -----
    public GameState getState() { return state; }
    public void setState(GameState state) { this.state = state; }
    public int getCurrentQuestionIndex() { return currentQuestionIndex; }
    public long getQuestionStartedAtMs() { return questionStartedAtMs; }
    public long getQuestionEndsAtMs() { return questionEndsAtMs; }
    public GameEvent getLastEvent() { return lastEvent; }
    public void setLastEvent(GameEvent lastEvent) { this.lastEvent = lastEvent; }

    public GameQuestion currentQuestion() {
        return questions.get(currentQuestionIndex);
    }

    public void beginQuestion(int index, long startedAtMs, long endsAtMs) {
        this.state = GameState.QUESTION;
        this.currentQuestionIndex = index;
        this.questionStartedAtMs = startedAtMs;
        this.questionEndsAtMs = endsAtMs;
        this.currentAnswers.clear();
    }

    // ----- timer -----
    public void setTimer(ScheduledFuture<?> timer) {
        cancelTimer();
        this.timer = timer;
    }

    public void cancelTimer() {
        if (timer != null) {
            timer.cancel(false);
            timer = null;
        }
    }

    // ----- activity (for idle cleanup) -----
    public void touch() { lastActivityMs = System.currentTimeMillis(); }
    public long getLastActivityMs() { return lastActivityMs; }

    // ----- players -----
    public Collection<Player> getPlayers() { return Collections.unmodifiableCollection(players.values()); }
    public int playerCount() { return players.size(); }
    public void addPlayer(Player player) { players.put(player.getId(), player); }
    public Player removePlayer(String playerId) { return players.remove(playerId); }
    public Player getPlayer(String playerId) { return players.get(playerId); }

    public Player findPlayerByConnection(String connectionId) {
        if (connectionId == null) return null;
        for (Player p : players.values()) {
            if (connectionId.equals(p.getConnectionId())) return p;
        }
        return null;
    }

    public Player findPlayerByToken(String token) {
        if (token == null) return null;
        for (Player p : players.values()) {
            if (token.equals(p.getReconnectToken())) return p;
        }
        return null;
    }

    public boolean nicknameTaken(String nickname) {
        for (Player p : players.values()) {
            if (p.getNickname().equalsIgnoreCase(nickname)) return true;
        }
        return false;
    }

    public int connectedPlayerCount() {
        int n = 0;
        for (Player p : players.values()) {
            if (p.isConnected()) n++;
        }
        return n;
    }

    public List<Player> connectedPlayers() {
        List<Player> list = new ArrayList<>();
        for (Player p : players.values()) {
            if (p.isConnected()) list.add(p);
        }
        return list;
    }

    // ----- answers for the current question -----
    public Map<String, PlayerAnswer> getCurrentAnswers() { return currentAnswers; }
}