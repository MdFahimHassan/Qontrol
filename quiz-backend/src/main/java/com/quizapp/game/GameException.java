package com.quizapp.game;

/**
 * A rule of the live game was broken (wrong state, bad nickname, not the host...).
 * Over WebSocket it is sent privately to the sender on /user/queue/errors;
 * over REST it is mapped to a 400/404 by GlobalExceptionHandler.
 */
public class GameException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final String code;

    public GameException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}