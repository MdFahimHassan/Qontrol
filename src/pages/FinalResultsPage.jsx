import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useRoomSession } from '../hooks/useGameSocket';
import { play } from '../utils/sound';
import { formatScore, ordinal } from '../utils/scoring';
import Navbar from '../components/layout/Navbar';
import PageContainer from '../components/layout/PageContainer';
import Podium from '../components/game/Podium';
import Leaderboard from '../components/game/Leaderboard';
import Confetti from '../components/game/Confetti';
import RoomLoading from '../components/game/RoomLoading';
import Button from '../components/common/Button';

// Shared by host and players: the route decides which role is looking.
export default function FinalResultsPage() {
  const { roomCode } = useParams();
  const { pathname } = useLocation();
  const role = pathname.startsWith('/host') ? 'HOST' : 'PLAYER';
  const game = useRoomSession(role, roomCode);

  const hasResults = !!game.finished;
  useEffect(() => {
    if (hasResults) play('fanfare');
  }, [hasResults]);

  if (!game.ready || !game.finished) return <RoomLoading message="Counting the final scores…" />;

  const { leaderboard, totalQuestions, quizTitle } = game.finished;
  const meId = game.me?.playerId;
  const mine = leaderboard.find((e) => e.playerId === meId);
  const celebrate = role === 'HOST' || (mine && mine.rank <= 3);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-pitch text-chalk">
      <Navbar roomCode={roomCode} connection={game.connection} />
      <Confetti active={!!celebrate} />
      <PageContainer width="lg" doodles>
        <div className="text-center mb-10">
          <p className="font-doodle text-xl text-chalk-dim">{quizTitle}</p>
          <h1 className="font-display font-bold text-3xl sm:text-5xl mt-1">Final results</h1>
          {mine && (
            <p className="mt-4 font-doodle text-2xl text-amber">
              You finished {ordinal(mine.rank)} with {formatScore(mine.score)} points ({mine.correctCount} of{' '}
              {totalQuestions} right)
            </p>
          )}
        </div>

        <Podium entries={leaderboard} meId={meId} />

        {leaderboard.length > 3 && (
          <section className="mt-12 max-w-xl mx-auto">
            <h2 className="font-display font-bold text-xl mb-4">Everyone else</h2>
            <Leaderboard entries={leaderboard.slice(3)} meId={meId} />
          </section>
        )}

        <div className="mt-12 flex justify-center">
          {role === 'HOST' ? (
            <Button to="/dashboard" size="lg">
              Back to dashboard
            </Button>
          ) : (
            <Button to="/join" size="lg">
              Join another game
            </Button>
          )}
        </div>
      </PageContainer>
    </div>
  );
}