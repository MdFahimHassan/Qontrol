import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRoomSession } from '../hooks/useGameSocket';
import { play } from '../utils/sound';
import Navbar from '../components/layout/Navbar';
import PageContainer from '../components/layout/PageContainer';
import QuestionCard from '../components/game/QuestionCard';
import AnswerButton from '../components/game/AnswerButton';
import CountdownRing from '../components/game/CountdownRing';
import Leaderboard from '../components/game/Leaderboard';
import GameError from '../components/game/GameError';
import RoomLoading from '../components/game/RoomLoading';
import Button from '../components/common/Button';
import { percent } from '../utils/scoring';

// The big-screen view: question + timer while players answer, then the
// correct answer, how everyone voted, and the top of the leaderboard.
export default function HostGamePage() {
  const { roomCode } = useParams();
  const game = useRoomSession('HOST', roomCode);
  const { phase, question, reveal, answerCount, clockOffset } = game;

  const questionIndex = question?.questionIndex;
  useEffect(() => {
    if (phase === 'QUESTION') play('start');
  }, [phase, questionIndex]);
  useEffect(() => {
    if (phase === 'REVEAL') play('reveal');
  }, [phase, questionIndex]);

  if (!game.ready || !question) return <RoomLoading message="Loading the question…" />;

  const answered = answerCount?.answered ?? 0;
  const totalPlayers = answerCount?.totalPlayers || game.playerCount;
  const revealing = phase === 'REVEAL' && reveal;
  const votes = revealing ? reveal.optionCounts.reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-pitch text-chalk">
      <Navbar roomCode={roomCode} connection={game.connection} />
      <PageContainer width="xl">
        <GameError error={game.fatal ? null : game.error} onDismiss={game.clearError} />

        {!revealing ? (
          <>
            <div className="flex items-start justify-between gap-6">
              <QuestionCard question={question} size="lg" className="flex-1" />
              <CountdownRing
                endsAtMs={question.endsAtMs}
                offsetMs={clockOffset}
                totalSeconds={question.timeLimitSeconds}
                size={128}
                tick
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-[14rem]">
                <p className="font-doodle text-xl text-chalk">
                  {answered} of {totalPlayers} answered
                </p>
                <div className="mt-2 h-2 rounded-full bg-turf-light overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full bg-cyan"
                    style={{ width: `${percent(answered, totalPlayers)}%`, transition: 'width 300ms' }}
                  />
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={game.revealNow}>
                Show answer now
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {question.options.map((o) => (
                <AnswerButton key={o.index} index={o.index} text={o.text} size="lg" />
              ))}
            </div>
          </>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_24rem] items-start">
            <section>
              <QuestionCard question={question} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {question.options.map((o) => (
                  <AnswerButton
                    key={o.index}
                    index={o.index}
                    text={o.text}
                    size="lg"
                    state={o.index === reveal.correctOptionIndex ? 'correct' : 'dimmed'}
                    count={reveal.optionCounts[o.index]}
                    total={votes}
                  />
                ))}
              </div>
            </section>

            <aside>
              <h2 className="font-display font-bold text-xl mb-4">Top players</h2>
              <Leaderboard key={reveal.questionIndex} entries={reveal.leaderboard} animateFromPrevious />
              <Button size="lg" className="w-full mt-6" onClick={game.nextQuestion}>
                {reveal.last ? 'See final results' : 'Next question'}
              </Button>
            </aside>
          </div>
        )}
      </PageContainer>
    </div>
  );
}