package com.quizapp.game.model;

public record PlayerAnswer(int optionIndex, long elapsedMs, boolean correct, int points) {}