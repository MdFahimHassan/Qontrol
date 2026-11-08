import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useRoomSession } from '../hooks/useGameSocket';
import { play, unlockAudio } from '../utils/sound';
import Navbar from '../components/layout/Navbar';
import PageContainer from '../components/layout/PageContainer';
import PlayerList from '../components/game/PlayerList';
import FlapText from '../components/game/FlapText';
import GameError from '../components/game/GameError';
import RoomLoading from '../components/game/RoomLoading';
import Button from '../components/common/Button';
import ConfirmModal from '../components/common/ConfirmModal';

export default function HostLobbyPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const game = useRoomSession('HOST', roomCode);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!game.ready) return <RoomLoading message="Opening your lobby…" />;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const joinUrl = `${origin}/join/${roomCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the link is visible on screen anyway */
    }
  };

  const start = () => {
    unlockAudio();
    play('start');
    game.startGame();
  };

  const cancel = () => {
    game.endGame();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-pitch text-chalk">
      <Navbar roomCode={roomCode} connection={game.connection} />
      <PageContainer width="lg" doodles>
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] items-start">
          <section>
            <p className="font-doodle text-xl text-chalk-dim">{game.quizTitle}</p>
            <h1 className="font-display font-bold text-2xl sm:text-3xl mt-1">
              Join at <span className="text-amber break-all">{host}/join</span>
            </h1>
            <p className="font-doodle text-lg text-chalk-dim mt-1 mb-5">then enter this PIN</p>
            <FlapText value={roomCode} size="xl" tone="amber" />
            <div className="mt-6">
              <Button variant="ghost" size="sm" onClick={copyLink}>
                {copied ? 'Link copied' : 'Copy join link'}
              </Button>
            </div>
          </section>

          <section className="justify-self-start lg:justify-self-end bg-chalk rounded-xl p-4 rotate-1 shadow-2xl">
            <QRCodeSVG value={joinUrl} size={176} bgColor="#f4f1e6" fgColor="#0e1b17" level="M" />
            <p className="mt-2 text-center font-doodle text-lg text-pitch">Scan to join</p>
          </section>
        </div>

        <section className="mt-10 border-t border-turf-light pt-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display font-bold text-xl">Players</h2>
            <FlapText value={game.playerCount} size="sm" tone="cyan" />
          </div>
          <PlayerList
            players={game.players}
            onKick={(id) => game.kickPlayer(id)}
            emptyText="Nobody yet. Share the PIN or the QR code."
          />
        </section>

        <div className="mt-8 space-y-3">
          <GameError error={game.fatal ? null : game.error} onDismiss={game.clearError} />
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={start} disabled={game.playerCount === 0}>
              Start game
            </Button>
            <Button variant="danger" size="lg" onClick={() => setConfirmEnd(true)}>
              Cancel game
            </Button>
          </div>
        </div>
      </PageContainer>

      <ConfirmModal
        open={confirmEnd}
        title="Cancel this game?"
        message="Everyone in the lobby will be sent back to the join screen."
        confirmLabel="Cancel game"
        cancelLabel="Keep waiting"
        onConfirm={cancel}
        onCancel={() => setConfirmEnd(false)}
      />
    </div>
  );
}