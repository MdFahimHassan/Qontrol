package com.quizapp.game.service;

import com.quizapp.game.GameException;
import com.quizapp.game.model.GameSession;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

/**
 * In-memory home of every live game. This is the piece to swap for Redis later:
 * everything else only talks to it through these methods.
 */
@Component
public class GameRegistry {

    private final ConcurrentHashMap<String, GameSession> sessions = new ConcurrentHashMap<>();
    /** STOMP principal name -> room code, so a disconnect can find its game. */
    private final ConcurrentHashMap<String, String> connectionRooms = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public GameSession create(Function<String, GameSession> factory) {
        for (int attempt = 0; attempt < 50; attempt++) {
            String code = GameLogic.generateRoomCode(random);
            GameSession session = factory.apply(code);
            if (sessions.putIfAbsent(code, session) == null) {
                return session;
            }
        }
        throw new GameException("NO_FREE_ROOM", "Could not allocate a room code, try again");
    }

    public Optional<GameSession> find(String roomCode) {
        return roomCode == null ? Optional.empty() : Optional.ofNullable(sessions.get(roomCode));
    }

    public GameSession require(String roomCode) {
        return find(roomCode).orElseThrow(() ->
                new GameException("ROOM_NOT_FOUND", "No game found with that code"));
    }

    public List<GameSession> all() {
        return new ArrayList<>(sessions.values());
    }

    public int size() {
        return sessions.size();
    }

    public void remove(String roomCode) {
        sessions.remove(roomCode);
        connectionRooms.values().removeIf(roomCode::equals);
    }

    public void bind(String connectionId, String roomCode) {
        connectionRooms.put(connectionId, roomCode);
    }

    public void unbind(String connectionId) {
        if (connectionId != null) {
            connectionRooms.remove(connectionId);
        }
    }

    public String roomOf(String connectionId) {
        return connectionId == null ? null : connectionRooms.get(connectionId);
    }
}