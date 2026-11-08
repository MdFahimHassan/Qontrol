package com.quizapp.game.controller;

import com.quizapp.game.GameDtos.AnswerRequest;
import com.quizapp.game.GameDtos.ErrorEvent;
import com.quizapp.game.GameDtos.JoinRequest;
import com.quizapp.game.GameDtos.KickRequest;
import com.quizapp.game.GameException;
import com.quizapp.game.service.GameService;
import com.quizapp.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * Thin STOMP adapter: figures out WHO is calling, then hands off to GameService.
 * Client sends to /app/game/{roomCode}/<action>.
 */
@Controller
public class GameSocketController {

    private static final Logger log = LoggerFactory.getLogger(GameSocketController.class);

    private final GameService gameService;

    public GameSocketController(GameService gameService) {
        this.gameService = gameService;
    }

    // ---------- player ----------

    @MessageMapping("/game/{roomCode}/join")
    public void join(@DestinationVariable String roomCode, Principal principal,
                     @Payload JoinRequest request) {
        gameService.join(roomCode, principal.getName(), request);
    }

    @MessageMapping("/game/{roomCode}/answer")
    public void answer(@DestinationVariable String roomCode, Principal principal,
                       @Payload AnswerRequest request) {
        gameService.submitAnswer(roomCode, principal.getName(), request);
    }

    // ---------- anyone ----------

    @MessageMapping("/game/{roomCode}/sync")
    public void sync(@DestinationVariable String roomCode, Principal principal) {
        gameService.sync(roomCode, principal.getName(), userIdOf(principal));
    }

    // ---------- host ----------

    @MessageMapping("/game/{roomCode}/start")
    public void start(@DestinationVariable String roomCode, Principal principal) {
        gameService.startGame(roomCode, userIdOf(principal));
    }

    @MessageMapping("/game/{roomCode}/reveal")
    public void reveal(@DestinationVariable String roomCode, Principal principal) {
        gameService.revealNow(roomCode, userIdOf(principal));
    }

    @MessageMapping("/game/{roomCode}/next")
    public void next(@DestinationVariable String roomCode, Principal principal) {
        gameService.nextQuestion(roomCode, userIdOf(principal));
    }

    @MessageMapping("/game/{roomCode}/end")
    public void end(@DestinationVariable String roomCode, Principal principal) {
        gameService.endGame(roomCode, userIdOf(principal));
    }

    @MessageMapping("/game/{roomCode}/kick")
    public void kick(@DestinationVariable String roomCode, Principal principal,
                     @Payload KickRequest request) {
        gameService.kick(roomCode, userIdOf(principal), request == null ? null : request.playerId());
    }

    // ---------- errors go back ONLY to the sender ----------

    @MessageExceptionHandler(GameException.class)
    @SendToUser(destinations = "/queue/errors", broadcast = false)
    public ErrorEvent onGameError(GameException ex) {
        return new ErrorEvent(ex.getCode(), ex.getMessage());
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser(destinations = "/queue/errors", broadcast = false)
    public ErrorEvent onUnexpected(Exception ex) {
        log.warn("Unexpected error handling STOMP message", ex);
        return new ErrorEvent("INVALID_MESSAGE", "Could not process that message");
    }

    /** Host connections carry the JWT-authenticated user; guests have no user id. */
    private static Long userIdOf(Principal principal) {
        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof UserPrincipal up) {
            return up.getId();
        }
        return null;
    }
}