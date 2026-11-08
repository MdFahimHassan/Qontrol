package com.quizapp.game.model;

public enum GameState {
    LOBBY,      // players joining
    QUESTION,   // question open, timer running
    REVEAL,     // correct answer + leaderboard shown, waiting for host to continue
    FINISHED    // final results
}