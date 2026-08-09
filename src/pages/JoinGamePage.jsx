import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const STORAGE_KEY = 'qontrol-player';

export default function JoinGamePage() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanNickname = nickname.trim();
    const cleanCode = roomCode.trim().toUpperCase();

    if (!cleanNickname) {
      setError('Pick a nickname first.');
      return;
    }
    if (cleanCode.length < 4) {
      setError('That room code looks too short — double-check it with the host.');
      return;
    }

    // Players don't log in — just remember who they are for this room so
    // the lobby/game/results pages can pick it back up without a round
    // trip through auth. Cleared once the game ends (see FinalResultsPage).
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nickname: cleanNickname, roomCode: cleanCode })
    );

    navigate(`/play/lobby/${cleanCode}`);
  };

  return (
    <PageContainer doodles="sparse">
      <div className="flex items-center justify-center min-h-screen px-4 py-16">
        <div className="w-full max-w-md p-8 bg-turf rounded-xl shadow-2xl border border-turf-light animate-rise-in">
          <h2 className="font-display font-bold text-3xl text-center text-chalk mb-2">
            JOIN A GAME
          </h2>
          <p className="font-doodle text-center text-chalk-dim mb-6">
            Got a room code from the host? Enter it below.
          </p>

          {error && (
            <div className="p-3 mb-4 text-sm text-coral bg-coral/10 border border-coral/30 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nickname"
              required
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="QuizWhiz42"
            />
            <Input
              label="Room Code"
              required
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="A3F9K1"
              fieldClassName="font-mono tracking-[0.3em] text-center uppercase"
              maxLength={6}
            />
            <Button type="submit" className="w-full">
              JOIN GAME
            </Button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
