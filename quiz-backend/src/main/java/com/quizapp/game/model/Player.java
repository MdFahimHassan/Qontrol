package com.quizapp.game.model;

import com.quizapp.game.GameDtos.AnswerResult;

public class Player {

    private final String id;
    private final String reconnectToken;
    private final String nickname;

    /** Name of the STOMP principal currently carrying this player (changes on reconnect). */
    private String connectionId;
    private boolean connected = true;

    private int score;
    private int correctCount;
    private AnswerResult lastResult;

    public Player(String id, String reconnectToken, String nickname, String connectionId) {
        this.id = id;
        this.reconnectToken = reconnectToken;
        this.nickname = nickname;
        this.connectionId = connectionId;
    }

    public String getId() { return id; }
    public String getReconnectToken() { return reconnectToken; }
    public String getNickname() { return nickname; }
    public String getConnectionId() { return connectionId; }
    public void setConnectionId(String connectionId) { this.connectionId = connectionId; }
    public boolean isConnected() { return connected; }
    public void setConnected(boolean connected) { this.connected = connected; }
    public int getScore() { return score; }
    public int getCorrectCount() { return correctCount; }
    public AnswerResult getLastResult() { return lastResult; }
    public void setLastResult(AnswerResult lastResult) { this.lastResult = lastResult; }

    public void award(int points) {
        this.score += points;
        this.correctCount++;
    }
}