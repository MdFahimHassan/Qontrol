import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';

function extractScores(payload) {
  const list = Array.isArray(payload) ? payload : payload?.leaderboard ?? payload?.players ?? [];
  return [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

// Plain scoreboard for now — the podium ranks, confetti and stagger-in
// animations described for Podium.jsx are milestone 4 polish. This page
// exists so the milestone-2 game loop has somewhere to land once
// /game-over fires, instead of blocking on that later work.
export default function FinalResultsPage() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const scores = extractScores(state?.finalPayload);

  const handleExit = () => {
    if (state?.isHost) {
      navigate('/dashboard');
    } else {
      sessionStorage.removeItem('qontrol-player');
      navigate('/join');
    }
  };

  return (
    <PageContainer roomCode={roomCode}>
      <div className="flex flex-col items-center px-4 py-16 text-center">
        <h1 className="font-display font-bold text-4xl text-chalk mb-2">GAME OVER</h1>
        <p className="font-doodle text-chalk-dim mb-10">Final scores for this round</p>

        <div className="w-full max-w-md bg-turf rounded-xl border border-turf-light divide-y divide-turf-light">
          {scores.length === 0 ? (
            <p className="p-6 font-doodle text-chalk-dim">No scores came through for this session.</p>
          ) : (
            scores.map((p, i) => (
              <div key={p.id ?? p.nickname ?? i} className="flex items-center justify-between px-5 py-3">
                <span className="flex items-center gap-3">
                  <span className="font-mono text-sm text-chalk-dim w-6">{i + 1}</span>
                  <span className="font-medium text-chalk">{p.nickname}</span>
                </span>
                <span className="font-mono font-bold text-amber">{p.score ?? 0}</span>
              </div>
            ))
          )}
        </div>

        <Button size="lg" className="mt-10" onClick={handleExit}>
          {state?.isHost ? 'BACK TO DASHBOARD' : 'JOIN ANOTHER GAME'}
        </Button>
      </div>
    </PageContainer>
  );
}
