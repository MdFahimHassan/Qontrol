package com.quizapp;

import com.quizapp.game.GameDtos.LeaderboardEntry;
import com.quizapp.game.GameException;
import com.quizapp.game.model.Player;
import com.quizapp.game.service.GameLogic;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** Pure unit tests: no Spring context, no database needed. */
class GameLogicTest {

    @Test
    void instantAnswerEarnsFullPoints() {
        assertEquals(1000, GameLogic.calculatePoints(1000, 0, 20));
    }

    @Test
    void pointsDecayLinearlyToHalf() {
        assertEquals(750, GameLogic.calculatePoints(1000, 10_000, 20));
        assertEquals(500, GameLogic.calculatePoints(1000, 20_000, 20));
    }

    @Test
    void lateAnswerIsClampedToHalf() {
        assertEquals(500, GameLogic.calculatePoints(1000, 25_000, 20));
    }

    @Test
    void nicknameIsNormalizedAndValidated() {
        assertEquals("Al ice", GameLogic.normalizeNickname("  Al   ice "));
        assertThrows(GameException.class, () -> GameLogic.normalizeNickname("   "));
        assertThrows(GameException.class, () -> GameLogic.normalizeNickname("x".repeat(21)));
    }

    @Test
    void tiedScoresShareARank() {
        Player a = new Player("a", "t", "Ann", "c1");
        Player b = new Player("b", "t", "Ben", "c2");
        Player c = new Player("c", "t", "Cat", "c3");
        a.award(500);
        b.award(500);
        c.award(100);

        List<LeaderboardEntry> board = GameLogic.buildLeaderboard(List.of(c, b, a), Map.of());

        assertEquals(1, board.get(0).rank());
        assertEquals(1, board.get(1).rank());
        assertEquals(3, board.get(2).rank());
    }
}