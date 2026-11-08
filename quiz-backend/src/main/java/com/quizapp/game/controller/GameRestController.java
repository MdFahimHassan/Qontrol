package com.quizapp.game.controller;

import com.quizapp.dto.response.QuizResponse;
import com.quizapp.entity.User;
import com.quizapp.exception.BadRequestException;
import com.quizapp.game.GameDtos.CreateGameRequest;
import com.quizapp.game.GameDtos.CreateGameResponse;
import com.quizapp.game.GameDtos.GameStatusResponse;
import com.quizapp.game.service.GameService;
import com.quizapp.security.UserPrincipal;
import com.quizapp.service.QuizService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/games")
public class GameRestController {

    private final GameService gameService;
    private final QuizService quizService;

    public GameRestController(GameService gameService, QuizService quizService) {
        this.gameService = gameService;
        this.quizService = quizService;
    }

    /** Host: open a lobby for one of their quizzes. Requires JWT. */
    @PostMapping
    public ResponseEntity<CreateGameResponse> create(@RequestBody CreateGameRequest request,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        if (request == null || request.quizId() == null) {
            throw new BadRequestException("quizId is required");
        }
        User host = principal.getUser();
        QuizResponse quiz = quizService.getOwnedQuiz(request.quizId(), host);
        return ResponseEntity.status(HttpStatus.CREATED).body(gameService.createGame(quiz, host));
    }

    /** Public: lets the join screen check a room code before opening a socket. */
    @GetMapping("/{roomCode}/status")
    public GameStatusResponse status(@PathVariable String roomCode) {
        return gameService.status(roomCode);
    }
}