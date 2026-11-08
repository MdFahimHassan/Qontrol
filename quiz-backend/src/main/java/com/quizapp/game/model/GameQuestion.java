package com.quizapp.game.model;

import java.util.List;

/** Immutable in-memory snapshot of a question, taken when the game is created. */
public record GameQuestion(Long id, String text, String imageUrl, int timeLimitSeconds,
                           int points, List<GameOption> options) {

    public int correctIndex() {
        for (GameOption option : options) {
            if (option.correct()) {
                return option.index();
            }
        }
        throw new IllegalStateException("Question " + id + " has no correct option");
    }
}