import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import PlayerList from '../components/game/PlayerList';
import Button from '../components/common/Button';
import { useGameSocket } from '../hooks/useGameSocket';

function extractPlayers(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.players ?? [];
}

export default function HostLobbyPage() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { connected, subscribe, publish } = useGameSocket(roomCode);

  const [players, setPlayers] = useState([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe('/players', (payload) => setPlayers(extractPlayers(payload)));
    return unsubscribe;
  }, [subscribe]);

  // Starting the game IS the first question landing — no separate "started"
  // event on the contract, so this doubles as our navigation trigger.
  useEffect(() => {
    const unsubscribe = subscribe('/question', (question) => {
      navigate(`/host/game/${roomCode}`, { state: { firstQuestion: question } });
    });
    return unsubscribe;
  }, [subscribe, navigate, roomCode]);

  const handleStart = () => {
    setStarting(true);
    publish('/start');
  };

  return (
    <PageContainer roomCode={roomCode} status={connected ? 'CONNECTED' : 'CONNECTING…'}>
      <div className="flex flex-col items-center px-4 py-16 text-center">
        <p className="font-doodle text-xl text-chalk-dim mb-1">Hosting</p>
        <h1 className="font-display font-bold text-3xl text-chalk mb-2">
          {state?.quizTitle ?? 'Quiz Room'}
        </h1>
        <p className="font-mono text-sm text-chalk-dim mb-8">
          Players join at <span className="text-cyan">/join</span> with code{' '}
          <span className="text-amber tracking-[0.3em]">{roomCode}</span>
        </p>

        <div className="w-full max-w-lg p-6 bg-turf rounded-xl border border-turf-light mb-8">
          <p className="font-mono text-xs tracking-widest text-chalk-dim mb-4">
            {players.length} PLAYER{players.length === 1 ? '' : 'S'} JOINED
          </p>
          <PlayerList
            players={players}
            emptyLabel="Share the room code — waiting for players to join…"
          />
        </div>

        <Button
          size="lg"
          disabled={players.length === 0 || starting}
          loading={starting}
          onClick={handleStart}
        >
          {starting ? 'STARTING…' : 'START GAME'}
        </Button>
      </div>
    </PageContainer>
  );
}
