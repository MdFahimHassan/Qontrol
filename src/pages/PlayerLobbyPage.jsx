import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import PlayerList from '../components/game/PlayerList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useGameSocket } from '../hooks/useGameSocket';

const STORAGE_KEY = 'qontrol-player';

function extractPlayers(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.players ?? [];
}

export default function PlayerLobbyPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { connected, subscribe, publish } = useGameSocket(roomCode);

  const [players, setPlayers] = useState([]);
  const [session, setSession] = useState(null); // { nickname, roomCode }
  const hasJoinedRef = useRef(false);

  // Pull back the nickname captured on JoinGamePage. No match for this
  // room means someone landed here directly (refresh, shared link, etc.)
  // — bounce them back to the join form instead of guessing who they are.
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    if (!parsed || parsed.roomCode !== roomCode) {
      navigate('/join', { replace: true });
      return;
    }
    setSession(parsed);
  }, [roomCode, navigate]);

  // Announce ourselves to the room once the socket is up. Guarded so a
  // stompjs reconnect doesn't re-fire the join message.
  useEffect(() => {
    if (!connected || !session || hasJoinedRef.current) return;
    publish('/join', { nickname: session.nickname });
    hasJoinedRef.current = true;
  }, [connected, session, publish]);

  useEffect(() => {
    const unsubscribe = subscribe('/players', (payload) => {
      const list = extractPlayers(payload);
      setPlayers(list);

      // Cache our own player id (if the backend assigns one) so the game
      // page can send it along with answers without re-deriving it.
      const self = list.find((p) => p.nickname === session?.nickname);
      if (self?.id) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, playerId: self.id }));
      }
    });
    return unsubscribe;
  }, [subscribe, session]);

  // The host starting the game is what moves everyone off the lobby — the
  // first /question broadcast IS the "game has started" signal. Carry the
  // payload forward via navigation state, since STOMP won't replay it once
  // PlayerGamePage subscribes on its own.
  useEffect(() => {
    const unsubscribe = subscribe('/question', (question) => {
      navigate(`/play/game/${roomCode}`, { state: { firstQuestion: question } });
    });
    return unsubscribe;
  }, [subscribe, navigate, roomCode]);

  return (
    <PageContainer roomCode={roomCode} status={connected ? 'CONNECTED' : 'CONNECTING…'}>
      <div className="flex flex-col items-center px-4 py-16 text-center">
        <p className="font-doodle text-2xl text-chalk-dim mb-1">You're in as</p>
        <h1 className="font-display font-bold text-4xl text-amber mb-8">
          {session?.nickname ?? '…'}
        </h1>

        <div className="w-full max-w-lg p-6 bg-turf rounded-xl border border-turf-light">
          <p className="font-mono text-xs tracking-widest text-chalk-dim mb-4">
            {players.length} PLAYER{players.length === 1 ? '' : 'S'} IN THE ROOM
          </p>
          <PlayerList
            players={players}
            emptyLabel="You're the first one here — waiting for others…"
          />
        </div>

        <div className="flex items-center gap-2 mt-10 text-chalk-dim">
          <LoadingSpinner size={18} />
          <span className="font-doodle">Waiting for the host to start the game…</span>
        </div>
      </div>
    </PageContainer>
  );
}
