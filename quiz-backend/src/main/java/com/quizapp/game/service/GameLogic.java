package com.quizapp.game.service;

import com.quizapp.game.GameDtos.LeaderboardEntry;
import com.quizapp.game.GameException;
import com.quizapp.game.model.Player;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/** Pure, framework-free rules of the game: scoring, ranking, validation. */
public final class GameLogic {

    public static final int MAX_NICKNAME_LENGTH = 20;

    private GameLogic() {}

    /**
     * Kahoot-style speed scoring: answering instantly earns the full points,
     * answering at the very last moment earns half. Elapsed time is clamped to
     * [0, timeLimit] so a late-but-accepted answer never goes below 50%.
     */
    public static int calculatePoints(int basePoints, long elapsedMs, int timeLimitSeconds) {
        long limitMs = Math.max(1L, timeLimitSeconds * 1000L);
        double ratio = Math.min(1.0, Math.max(0.0, (double) elapsedMs / limitMs));
        return (int) Math.round(basePoints * (1.0 - ratio / 2.0));
    }

    /**
     * Sorts by score (desc), then correct answers (desc), then nickname.
     * Players with the same score share a rank (1, 2, 2, 4 ...).
     */
    public static List<LeaderboardEntry> buildLeaderboard(Collection<Player> players,
                                                          Map<String, Integer> gainedThisRound) {
        List<Player> sorted = new ArrayList<>(players);
        sorted.sort(Comparator
                .comparingInt(Player::getScore).reversed()
                .thenComparing(Comparator.comparingInt(Player::getCorrectCount).reversed())
                .thenComparing(p -> p.getNickname().toLowerCase()));

        List<LeaderboardEntry> entries = new ArrayList<>(sorted.size());
        int previousScore = Integer.MIN_VALUE;
        int previousRank = 0;
        for (int i = 0; i < sorted.size(); i++) {
            Player p = sorted.get(i);
            int rank = (p.getScore() == previousScore) ? previousRank : i + 1;
            int gained = gainedThisRound.getOrDefault(p.getId(), 0);
            entries.add(new LeaderboardEntry(rank, p.getId(), p.getNickname(),
                    p.getScore(), gained, p.getCorrectCount()));
            previousScore = p.getScore();
            previousRank = rank;
        }
        return entries;
    }

    /** Trims, collapses whitespace, strips control characters, enforces 1..20 chars. */
    public static String normalizeNickname(String raw) {
        if (raw == null) {
            throw new GameException("INVALID_NICKNAME", "Please enter a nickname");
        }
        String cleaned = raw.replaceAll("\\p{Cntrl}", "").replaceAll("\\s+", " ").trim();
        if (cleaned.isEmpty()) {
            throw new GameException("INVALID_NICKNAME", "Please enter a nickname");
        }
        if (cleaned.length() > MAX_NICKNAME_LENGTH) {
            throw new GameException("INVALID_NICKNAME",
                    "Nickname can be at most " + MAX_NICKNAME_LENGTH + " characters");
        }
        return cleaned;
    }

    /** Six digits, easy to type on a phone. Uniqueness is enforced by the registry. */
    public static String generateRoomCode(SecureRandom random) {
        return String.format("%06d", random.nextInt(1_000_000));
    }
}