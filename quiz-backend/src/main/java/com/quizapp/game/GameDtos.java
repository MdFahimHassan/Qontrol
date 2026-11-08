package com.quizapp.game;

import java.util.List;

/**
 * Every message that crosses the wire for live games. Kept in one file so the
 * whole protocol is readable at a glance (see GAME_PROTOCOL.md).
 *
 * IMPORTANT: nothing broadcast to players may reveal which option is correct
 * before the reveal phase — QuestionData therefore only carries index + text.
 */
public final class GameDtos {

    private GameDtos() {}

    // ---------- inbound (client -> server) ----------
    public record CreateGameRequest(Long quizId) {}
    public record JoinRequest(String nickname, String reconnectToken) {}
    public record AnswerRequest(int questionIndex, int optionIndex) {}
    public record KickRequest(String playerId) {}

    // ---------- REST responses ----------
    public record CreateGameResponse(String roomCode, String quizTitle, int questionCount) {}
    public record GameStatusResponse(String roomCode, String state, String quizTitle, int playerCount) {}

    // ---------- broadcast envelope: /topic/room/{code} ----------
    public record GameEvent(String type, Object data) {}

    public record PlayerInfo(String id, String nickname, boolean connected) {}
    public record LobbyData(String roomCode, String quizTitle, List<PlayerInfo> players) {}

    public record OptionData(int index, String text) {}
    public record QuestionData(int questionIndex, int totalQuestions, String text, String imageUrl,
                               List<OptionData> options, int timeLimitSeconds, int points,
                               long startedAtMs, long endsAtMs, long serverNowMs) {}

    public record AnswerCountData(int questionIndex, int answered, int totalPlayers) {}

    public record LeaderboardEntry(int rank, String playerId, String nickname,
                                   int score, int gained, int correctCount) {}
    public record RevealData(int questionIndex, int correctOptionIndex, int[] optionCounts,
                             List<LeaderboardEntry> leaderboard, boolean last) {}
    public record FinishedData(String quizTitle, int totalQuestions, List<LeaderboardEntry> leaderboard) {}
    public record CancelledData(String reason) {}

    // ---------- private (server -> one client): /user/queue/... ----------
    public record JoinAck(String roomCode, String playerId, String reconnectToken, String nickname) {}
    public record AnswerAck(int questionIndex) {}
    public record AnswerResult(int questionIndex, boolean answered, boolean correct,
                               int pointsAwarded, int totalScore, int rank) {}
    public record SyncData(String role, JoinAck me, GameEvent event, AnswerResult lastResult,
                           Integer answeredOption, QuestionData question, long serverNowMs) {}
    public record ErrorEvent(String code, String message) {}
}