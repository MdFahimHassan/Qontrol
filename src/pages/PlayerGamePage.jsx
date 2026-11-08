import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRoomSession } from '../hooks/useGameSocket';
import { useCountdown } from '../hooks/useCountdown';
import { play } from '../utils/sound';
import { formatScore, ordinal, pointsAvailable } from '../utils/scoring';
import Navbar from '../components/layout/Navbar';
import PageContainer from '../components/layout/PageContainer';
import QuestionCard from '../components/game/QuestionCard';
import AnswerButton from '../components/game/AnswerButton';
import CountdownRing from '../components/game/CountdownRing';
import Leaderboard from '../components/game/Leaderboard';
import FlapText from '../components/game/FlapText';
import GameError from '../components/game/GameError';
import RoomLoading from '../components/game/RoomLoading';

// How many points an answer would earn if tapped right now (it shrinks as time runs out).
function PointsOnOffer({ question, offsetMs }) {
  const { remainingMs } = useCountdown(question.endsAtMs, offsetMs);
  const points = pointsAvailable(question.points, remainingMs, question.timeLimitSeconds * 1000);
  return <p className="font-doodle text-lg text-amber tabular-nums">Worth {formatScore(points)} points right now</p>;
}

function tileState(index, correctIndex, choice) {
  if (index === correctIndex) return 'correct';
  if (choice && index === choice.optionIndex) return 'wrong';
  return 'dimmed';
}

export default function PlayerGamePage() {
  const { roomCode } = useParams();
  const game = useRoomSession('PLAYER', roomCode);
  const { phase, question, reveal, myChoice, myResult, myScore, clockOffset, answerCount } = game;

  const questionIndex = question?.questionIndex;
  useEffect(() => {
    if (phase === 'QUESTION') play('start');
  }, [phase, questionIndex]);
  useEffect(() => {
    if (!myResult) return;
    play(myResult.correct ? 'correct' : 'wrong');
  }, [myResult]);

  if (!game.ready || !question) return <RoomLoading message="Getting the next question…" />;

  const pick = (index) => {
    play('tap');
    game.submitAnswer(index);
  };

  const revealing = phase === 'REVEAL' && reveal;
  const totalPlayers = answerCount?.totalPlayers || game.playerCount;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-pitch text-chalk">
      <Navbar roomCode={roomCode} connection={game.connection} />
      <PageContainer width="md" className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display font-bold text-chalk truncate">{game.me?.nickname}</span>
          <FlapText value={formatScore(myScore)} size="sm" tone="amber" />
        </div>

        <GameError error={game.fatal ? null : game.error} onDismiss={game.clearError} />

        {!revealing ? (
          <>
            <div className="flex items-start gap-4">
              <QuestionCard question={question} className="flex-1" />
              <CountdownRing
                endsAtMs={question.endsAtMs}
                offsetMs={clockOffset}
                totalSeconds={question.timeLimitSeconds}
                size={72}
              />
            </div>

            {myChoice ? (
              <p className="font-doodle text-lg text-cyan" role="status">
                Answer locked in.{' '}
                {answerCount ? `${answerCount.answered} of ${totalPlayers} have answered.` : ''}
              </p>
            ) : (
              <PointsOnOffer question={question} offsetMs={clockOffset} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((o) => (
                <AnswerButton
                  key={o.index}
                  index={o.index}
                  text={o.text}
                  state={myChoice ? (myChoice.optionIndex === o.index ? 'selected' : 'dimmed') : 'idle'}
                  disabled={!!myChoice}
                  onClick={() => pick(o.index)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={`rounded-xl border p-6 text-center ${
                myResult?.correct ? 'border-cyan/40 bg-cyan/10' : 'border-coral/40 bg-coral/10'
              }`}
              role="status"
            >
              {myResult ? (
                <>
                  <h2 className={`font-display font-black text-3xl ${myResult.correct ? 'text-cyan' : 'text-coral'}`}>
                    {myResult.correct ? 'Correct!' : myResult.answered ? 'Not this time' : 'Time ran out'}
                  </h2>
                  {myResult.correct && (
                    <p className="mt-2 font-mono text-4xl font-bold text-chalk tabular-nums">
                      +{formatScore(myResult.pointsAwarded)}
                    </p>
                  )}
                  <p className="mt-3 font-doodle text-xl text-chalk-dim">
                    You're {ordinal(myResult.rank)}
                    {totalPlayers > 0 ? ` of ${totalPlayers}` : ''} with {formatScore(myResult.totalScore)} points
                  </p>
                </>
              ) : (
                <p className="font-doodle text-xl text-chalk-dim">Counting up the points…</p>
              )}
            </motion.section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((o) => (
                <AnswerButton
                  key={o.index}
                  index={o.index}
                  text={o.text}
                  state={tileState(o.index, reveal.correctOptionIndex, myChoice)}
                />
              ))}
            </div>

            <div>
              <h2 className="font-display font-bold text-lg mb-3">Leaderboard</h2>
              <Leaderboard
                key={reveal.questionIndex}
                entries={reveal.leaderboard}
                meId={game.me?.playerId}
                animateFromPrevious
              />
            </div>
            <p className="text-center font-doodle text-lg text-chalk-dim">Waiting for the host to continue…</p>
          </>
        )}
      </PageContainer>
    </div>
  );
}