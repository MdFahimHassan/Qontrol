import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { gameService } from '../services/gameService';
import { loadPlayerSession } from '../services/gameClient';
import { useGameSocket } from '../hooks/useGameSocket';
import { unlockAudio } from '../utils/sound';
import Navbar from '../components/layout/Navbar';
import PageContainer from '../components/layout/PageContainer';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

function messageFor(err) {
  if (err?.isAxiosError) {
    if (err.response?.status === 404) {
      return "We couldn't find a game with that PIN. Check the number on the host's screen.";
    }
    if (err.response) return err.response.data?.message || 'Something went wrong. Try again.';
    return "Can't reach the game server. Check your connection and try again.";
  }
  if (err?.code === 'CANCELLED') return '';
  return err?.message || 'Something went wrong. Try again.';
}

export default function JoinGamePage() {
  const { code } = useParams(); // /join/:code (QR code link)
  const [search] = useSearchParams(); // /join?code=123456
  const location = useLocation();
  const navigate = useNavigate();
  const game = useGameSocket();

  const [pin, setPin] = useState(() => (code || search.get('code') || '').replace(/\D/g, '').slice(0, 6));
  const [nickname, setNickname] = useState(() => loadPlayerSession()?.nickname || '');
  const [error, setError] = useState(location.state?.notice || '');
  const [loading, setLoading] = useState(false);

  // Landing here always starts clean: drop any previous game connection.
  useEffect(() => {
    game.leave();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const name = nickname.trim();
    if (pin.length !== 6) return setError('Enter the 6-digit game PIN.');
    if (!name) return setError('Pick a nickname.');

    unlockAudio(); // browsers only allow sound after a tap
    setLoading(true);
    try {
      const status = await gameService.getStatus(pin);
      const hasTicket = loadPlayerSession()?.roomCode === pin; // coming back to a game in progress
      if (status.state !== 'LOBBY' && !hasTicket) {
        setError('That game has already started.');
        return;
      }
      await game.joinRoom(pin, name);
      navigate(`/play/${pin}`);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-pitch text-chalk">
      <Navbar showMute={false} />
      <PageContainer width="sm" center doodles>
        <form
          onSubmit={onSubmit}
          className="w-full text-left bg-turf border border-turf-light rounded-xl p-6 sm:p-8 shadow-2xl -rotate-1 animate-rise-in"
        >
          <h1 className="font-display font-bold text-3xl text-chalk mb-1">Join a game</h1>
          <p className="font-doodle text-lg text-chalk-dim mb-6">The PIN is on the host's screen.</p>

          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-coral/30 bg-coral/10 px-4 py-2 text-sm text-coral">
              {error}
            </p>
          )}

          <Input
            label="Game PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="000000"
            fieldClassName="font-mono text-3xl text-center tracking-[0.3em]"
            className="mb-4"
          />
          <Input
            label="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            autoComplete="off"
            placeholder="What should we call you?"
            className="mb-6"
          />

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Join game
          </Button>
        </form>

        <p className="relative z-10 mt-6 text-sm text-chalk-dim">
          Hosting a quiz?{' '}
          <Link to="/login" className="text-amber hover:underline">
            Log in
          </Link>
        </p>
      </PageContainer>
    </div>
  );
}