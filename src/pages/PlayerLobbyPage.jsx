import { useNavigate, useParams } from 'react-router-dom';
import { useRoomSession } from '../hooks/useGameSocket';
import Navbar from '../components/layout/Navbar';
import PageContainer from '../components/layout/PageContainer';
import PlayerList from '../components/game/PlayerList';
import FlapText from '../components/game/FlapText';
import RoomLoading from '../components/game/RoomLoading';
import Button from '../components/common/Button';

export default function PlayerLobbyPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const game = useRoomSession('PLAYER', roomCode);

  if (!game.ready) return <RoomLoading message="Joining the game…" />;

  const meId = game.me?.playerId;
  const others = game.players.filter((p) => p.id !== meId);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-pitch text-chalk">
      <Navbar roomCode={roomCode} connection={game.connection} />
      <PageContainer width="sm" center doodles>
        <img
          src="/doodles/hello_bubble.gif"
          alt=""
          aria-hidden="true"
          className="w-28 h-28 mb-2 doodle-float"
          style={{ '--doodle-rot': '-4deg' }}
        />
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-chalk break-words max-w-full">
          You're in, <span className="text-amber">{game.me?.nickname}</span>
        </h1>
        <p className="font-doodle text-xl text-chalk-dim mt-2">
          {game.quizTitle ? `${game.quizTitle} starts when the host is ready.` : 'Waiting for the host to start.'}
        </p>

        <div className="mt-8 flex items-center gap-3">
          <FlapText value={game.playerCount} size="md" tone="amber" />
          <span className="font-doodle text-lg text-chalk-dim">
            {game.playerCount === 1 ? 'player here' : 'players here'}
          </span>
        </div>

        {others.length > 0 && (
          <div className="mt-6 w-full flex justify-center">
            <PlayerList players={others} meId={meId} />
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="mt-10"
          onClick={() => {
            game.leave();
            navigate('/join');
          }}
        >
          Leave game
        </Button>
      </PageContainer>
    </div>
  );
}