package com.quizapp.game.service;

import com.quizapp.dto.response.OptionResponse;
import com.quizapp.dto.response.QuestionResponse;
import com.quizapp.dto.response.QuizResponse;
import com.quizapp.entity.User;
import com.quizapp.game.GameDtos.AnswerRequest;
import com.quizapp.game.GameDtos.AnswerResult;
import com.quizapp.game.GameDtos.FinishedData;
import com.quizapp.game.GameDtos.GameEvent;
import com.quizapp.game.GameDtos.JoinAck;
import com.quizapp.game.GameDtos.JoinRequest;
import com.quizapp.game.GameDtos.LobbyData;
import com.quizapp.game.GameDtos.OptionData;
import com.quizapp.game.GameDtos.QuestionData;
import com.quizapp.game.GameDtos.RevealData;
import com.quizapp.game.GameDtos.SyncData;
import com.quizapp.game.GameException;
import com.quizapp.game.model.GameSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Plays whole games against the real GameService with no Spring context and no
 * network. Messages that would go out over STOMP are recorded instead.
 */
class GameServiceTest {

    /** Records everything the service would have sent. */
    static class RecordingTemplate extends SimpMessagingTemplate {
        record Sent(String user, String destination, Object payload) {}

        final List<Sent> sent = new CopyOnWriteArrayList<>();

        RecordingTemplate() {
            super((message, timeout) -> true);
        }

        @Override
        public void convertAndSend(String destination, Object payload) {
            sent.add(new Sent(null, destination, payload));
        }

        @Override
        public void convertAndSendToUser(String user, String destination, Object payload) {
            sent.add(new Sent(user, destination, payload));
        }

        <T> T lastPrivate(String user, String destination, Class<T> type) {
            for (int i = sent.size() - 1; i >= 0; i--) {
                Sent s = sent.get(i);
                if (user.equals(s.user()) && destination.equals(s.destination()) && type.isInstance(s.payload())) {
                    return type.cast(s.payload());
                }
            }
            return null;
        }

        GameEvent lastBroadcast(String type) {
            for (int i = sent.size() - 1; i >= 0; i--) {
                Sent s = sent.get(i);
                if (s.user() == null && s.payload() instanceof GameEvent e && e.type().equals(type)) return e;
            }
            return null;
        }
    }

    private RecordingTemplate template;
    private GameRegistry registry;
    private GameService service;
    private final User host = User.builder().id(1L).build();
    private static final long HOST_ID = 1L;

    @BeforeEach
    void setUp() {
        template = new RecordingTemplate();
        registry = new GameRegistry();
        service = new GameService(registry, template);
    }

    @AfterEach
    void tearDown() {
        service.shutdown();
    }

    // ---------- helpers ----------

    private static QuestionResponse question(long id, String text, int limitSeconds, int points, int correctIndex) {
        List<OptionResponse> options = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            options.add(OptionResponse.builder().optionText("option " + i).isCorrect(i == correctIndex).build());
        }
        return QuestionResponse.builder().id(id).questionText(text).timeLimitSeconds(limitSeconds)
                .points(points).options(options).build();
    }

    private static QuizResponse quiz(QuestionResponse... questions) {
        return QuizResponse.builder().id(7L).title("Test Quiz").questions(List.of(questions)).build();
    }

    private String openGame(QuestionResponse... questions) {
        return service.createGame(quiz(questions), host).roomCode();
    }

    private JoinAck join(String room, String connection, String nickname) {
        service.join(room, connection, new JoinRequest(nickname, null));
        return template.lastPrivate(connection, "/queue/join", JoinAck.class);
    }

    private static String errorCode(Runnable action) {
        try {
            action.run();
            return null;
        } catch (GameException e) {
            return e.getCode();
        }
    }

    // ---------- lobby ----------

    @Test
    void roomCodeIsSixDigits() {
        assertTrue(openGame(question(1, "Q", 20, 1000, 0)).matches("\\d{6}"));
    }

    @Test
    void quizWithTwoCorrectAnswersCannotBeHosted() {
        QuestionResponse bad = QuestionResponse.builder().id(1L).questionText("bad").timeLimitSeconds(20).points(1000)
                .options(List.of(
                        OptionResponse.builder().optionText("a").isCorrect(true).build(),
                        OptionResponse.builder().optionText("b").isCorrect(true).build()))
                .build();
        assertEquals("INVALID_QUIZ", errorCode(() -> service.createGame(quiz(bad), host)));
    }

    @Test
    void playersJoinAndEveryoneSeesTheLobby() {
        String room = openGame(question(1, "Q", 20, 1000, 0));
        JoinAck ann = join(room, "c1", "Ann");
        join(room, "c2", "Bo");

        assertNotNull(ann.reconnectToken());
        LobbyData lobby = (LobbyData) template.lastBroadcast("LOBBY_UPDATE").data();
        assertEquals(2, lobby.players().size());
    }

    @Test
    void duplicateNicknameIsRejectedIgnoringCase() {
        String room = openGame(question(1, "Q", 20, 1000, 0));
        join(room, "c1", "Ann");
        assertEquals("NICKNAME_TAKEN", errorCode(() -> join(room, "c2", "ann")));
    }

    @Test
    void retriedJoinFromTheSameConnectionIsIdempotent() {
        String room = openGame(question(1, "Q", 20, 1000, 0));
        JoinAck first = join(room, "c1", "Ann");
        JoinAck second = join(room, "c1", "Ann");

        assertEquals(first.playerId(), second.playerId());
        assertEquals(1, service.status(room).playerCount());
    }

    @Test
    void unknownRoomIsReported() {
        assertEquals("ROOM_NOT_FOUND", errorCode(() -> service.status("000000")));
    }

    @Test
    void onlyTheHostCanStartAndOnlyWithPlayers() {
        String room = openGame(question(1, "Q", 20, 1000, 0));
        assertEquals("NO_PLAYERS", errorCode(() -> service.startGame(room, HOST_ID)));
        join(room, "c1", "Ann");
        assertEquals("NOT_HOST", errorCode(() -> service.startGame(room, null)));
        assertEquals("NOT_HOST", errorCode(() -> service.startGame(room, 99L)));
        service.startGame(room, HOST_ID);
        assertEquals("QUESTION", service.status(room).state());
    }

    @Test
    void playersCannotJoinOnceTheGameHasStarted() {
        String room = openGame(question(1, "Q", 20, 1000, 0));
        join(room, "c1", "Ann");
        service.startGame(room, HOST_ID);
        assertEquals("GAME_IN_PROGRESS", errorCode(() -> join(room, "c9", "Late")));
    }

    @Test
    void hostCanKickInTheLobby() {
        String room = openGame(question(1, "Q", 20, 1000, 0));
        JoinAck ann = join(room, "c1", "Ann");
        service.kick(room, HOST_ID, ann.playerId());
        assertEquals(0, service.status(room).playerCount());
        assertNotNull(template.lastPrivate("c1", "/queue/kicked", com.quizapp.game.GameDtos.ErrorEvent.class));
    }

    @Test
    void lobbyDisconnectRemovesThePlayer() {
        String room = openGame(question(1, "Q", 20, 1000, 0));
        join(room, "c1", "Ann");
        service.handleDisconnect("c1");
        assertEquals(0, service.status(room).playerCount());
    }

    // ---------- a round of play ----------

    @Test
    void questionPayloadNeverRevealsTheCorrectAnswer() {
        boolean leaks = Arrays.stream(OptionData.class.getRecordComponents())
                .anyMatch(c -> c.getName().toLowerCase().contains("correct"));
        assertFalse(leaks);
    }

    @Test
    void roundScoresRanksAndAutoRevealsWhenEveryoneAnswered() {
        String room = openGame(question(1, "2+2?", 20, 1000, 2));
        join(room, "c1", "Ann");
        join(room, "c2", "Bo");
        service.startGame(room, HOST_ID);

        QuestionData asked = (QuestionData) template.lastBroadcast("QUESTION").data();
        assertEquals(4, asked.options().size());

        service.submitAnswer(room, "c1", new AnswerRequest(0, 2)); // correct
        assertEquals("QUESTION", service.status(room).state());     // Bo hasn't answered yet
        assertNull(template.lastPrivate("c1", "/queue/answer-result", AnswerResult.class)); // no early result
        service.submitAnswer(room, "c2", new AnswerRequest(0, 1)); // wrong

        assertEquals("REVEAL", service.status(room).state());
        RevealData reveal = (RevealData) template.lastBroadcast("REVEAL").data();
        assertEquals(2, reveal.correctOptionIndex());
        assertArrayEquals(new int[] {0, 1, 1, 0}, reveal.optionCounts());
        assertEquals("Ann", reveal.leaderboard().get(0).nickname());

        AnswerResult ann = template.lastPrivate("c1", "/queue/answer-result", AnswerResult.class);
        AnswerResult bo = template.lastPrivate("c2", "/queue/answer-result", AnswerResult.class);
        assertTrue(ann.correct() && ann.pointsAwarded() >= 950 && ann.rank() == 1);
        assertTrue(!bo.correct() && bo.pointsAwarded() == 0 && bo.rank() == 2);
    }

    @Test
    void answersAreValidated() {
        String room = openGame(question(1, "Q", 20, 1000, 0));
        join(room, "c1", "Ann");
        join(room, "c2", "Bo");
        service.startGame(room, HOST_ID);

        assertEquals("NOT_IN_GAME", errorCode(() -> service.submitAnswer(room, "stranger", new AnswerRequest(0, 0))));
        assertEquals("INVALID_OPTION", errorCode(() -> service.submitAnswer(room, "c1", new AnswerRequest(0, 9))));
        assertEquals("STALE_QUESTION", errorCode(() -> service.submitAnswer(room, "c1", new AnswerRequest(5, 0))));
        service.submitAnswer(room, "c1", new AnswerRequest(0, 0));
        assertEquals("ALREADY_ANSWERED", errorCode(() -> service.submitAnswer(room, "c1", new AnswerRequest(0, 1))));
    }

    @Test
    void serverClosesTheQuestionWhenTheTimerRunsOut() throws InterruptedException {
        String room = openGame(question(1, "Fast", 1, 1000, 0));
        join(room, "c1", "Ann");
        service.startGame(room, HOST_ID);
        assertEquals("QUESTION", service.status(room).state());

        Thread.sleep(2000); // 1s limit + 0.5s grace
        assertEquals("REVEAL", service.status(room).state());
        AnswerResult result = template.lastPrivate("c1", "/queue/answer-result", AnswerResult.class);
        assertFalse(result.answered());
    }

    @Test
    void hostFlowGoesToFinishedAndEndsCleanly() {
        String room = openGame(question(1, "Q1", 20, 1000, 0), question(2, "Q2", 20, 1000, 1));
        join(room, "c1", "Ann");
        service.startGame(room, HOST_ID);

        assertEquals("NOT_HOST", errorCode(() -> service.nextQuestion(room, null)));
        assertEquals("INVALID_STATE", errorCode(() -> service.nextQuestion(room, HOST_ID))); // still on question 1
        service.revealNow(room, HOST_ID);
        service.nextQuestion(room, HOST_ID);
        service.revealNow(room, HOST_ID);
        assertTrue(((RevealData) template.lastBroadcast("REVEAL").data()).last());
        service.nextQuestion(room, HOST_ID);

        assertEquals("FINISHED", service.status(room).state());
        FinishedData finished = (FinishedData) template.lastBroadcast("FINISHED").data();
        assertEquals(1, finished.leaderboard().size());

        service.endGame(room, HOST_ID);
        assertEquals("ROOM_NOT_FOUND", errorCode(() -> service.status(room)));
        assertNotNull(template.lastBroadcast("CANCELLED"));
    }

    // ---------- reconnect / refresh ----------

    @Test
    void aDisconnectedPlayerKeepsTheirScoreAndRejoinsWithTheToken() {
        String room = openGame(question(1, "Q1", 20, 1000, 0), question(2, "Q2", 20, 1000, 1));
        JoinAck ann = join(room, "c1", "Ann");
        join(room, "c2", "Bo");
        service.startGame(room, HOST_ID);
        service.submitAnswer(room, "c1", new AnswerRequest(0, 0));
        service.submitAnswer(room, "c2", new AnswerRequest(0, 3));

        service.handleDisconnect("c1");
        service.join(room, "c1-new", new JoinRequest(null, ann.reconnectToken()));

        JoinAck back = template.lastPrivate("c1-new", "/queue/join", JoinAck.class);
        assertEquals(ann.playerId(), back.playerId());

        service.sync(room, "c1-new", null);
        SyncData sync = template.lastPrivate("c1-new", "/queue/sync", SyncData.class);
        assertEquals("PLAYER", sync.role());
        assertEquals("REVEAL", sync.event().type());
        assertNotNull(sync.lastResult());
        assertTrue(sync.lastResult().totalScore() > 0);
    }

    @Test
    void syncDuringRevealCarriesTheQuestionAndThePlayersChoice() {
        String room = openGame(question(1, "Q1", 20, 1000, 0), question(2, "Q2", 20, 1000, 1));
        join(room, "c1", "Ann");
        service.startGame(room, HOST_ID);
        service.submitAnswer(room, "c1", new AnswerRequest(0, 3)); // only player -> auto reveal

        service.sync(room, "c1", null);
        SyncData sync = template.lastPrivate("c1", "/queue/sync", SyncData.class);
        assertNotNull(sync.question());
        assertEquals(0, sync.question().questionIndex());
        assertEquals(3, sync.answeredOption().intValue());

        service.sync(room, "hostConn", HOST_ID);
        assertEquals("HOST", template.lastPrivate("hostConn", "/queue/sync", SyncData.class).role());
    }

    @Test
    void aBogusReconnectTokenMidGameIsRefused() {
        String room = openGame(question(1, "Q", 20, 1000, 0));
        join(room, "c1", "Ann");
        service.startGame(room, HOST_ID);
        assertEquals("REJOIN_FAILED", errorCode(() -> service.join(room, "x", new JoinRequest(null, "nope"))));
    }

    // ---------- limits ----------

    @Test
    void aHostCannotKeepMoreThanTenGamesOpen() {
        QuestionResponse q = question(1, "Q", 20, 1000, 0);
        for (int i = 0; i < GameService.MAX_GAMES_PER_HOST; i++) {
            openGame(q);
        }
        assertEquals("TOO_MANY_GAMES", errorCode(() -> openGame(q)));
    }

    @Test
    void anEmptyUntouchedLobbyCountsAsAbandonedOnlyAfterAWhile() {
        String room = openGame(question(1, "Q", 20, 1000, 0));
        GameSession session = registry.require(room);
        long now = System.currentTimeMillis();

        assertFalse(GameService.isAbandonedLobby(session, now));
        assertTrue(GameService.isAbandonedLobby(session, now + GameService.ABANDONED_LOBBY_MS + 1000));

        join(room, "c1", "Ann");
        assertFalse(GameService.isAbandonedLobby(session, now + GameService.ABANDONED_LOBBY_MS + 1000)); // has a player
    }
}