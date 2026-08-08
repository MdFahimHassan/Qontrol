import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import DoodleBackground from '../components/common/DoodleBackground';
import CursorTrail from '../components/common/CursorTrail';
import Scribble from '../components/common/Scribble';
import Button from '../components/common/Button';

// Split-flap letter tile — the product's signature motion, used here for the
// hero wordmark. Each letter flips in on a staggered delay like a departure
// board resolving. Respects prefers-reduced-motion via the global CSS rule.
function FlapLetter({ char, delay }) {
  return (
    <span
      className="inline-block"
      style={{
        animationName: 'flap-flip',
        animationDuration: '0.7s',
        animationTimingFunction: 'cubic-bezier(0.45, 0, 0.55, 1)',
        animationDelay: `${delay}ms`,
        animationFillMode: 'backwards',
        transformStyle: 'preserve-3d',
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  );
}

// The 8-letter flap-in takes ~720ms to fully resolve — worth it as a first
// impression, but not something a returning visitor should sit through
// every time they bounce back to "/". Skip straight to the settled state
// after the first visit this session.
function FlapWord({ text, startDelay = 0 }) {
  const alreadySeen =
    typeof window !== 'undefined' && sessionStorage.getItem('qontrol-intro-seen');

  return (
    <span className="inline-block" style={{ perspective: '400px' }}>
      {text.split('').map((char, i) =>
        alreadySeen ? (
          <span key={i} className="inline-block">
            {char === ' ' ? '\u00A0' : char}
          </span>
        ) : (
          <FlapLetter key={i} char={char} delay={startDelay + i * 90} />
        )
      )}
    </span>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    sessionStorage.setItem('qontrol-intro-seen', '1');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-pitch text-chalk">
      {/* Scorebug bar — frames the page as a match already in progress */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-turf-light bg-turf/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-coral animate-live-pulse" aria-hidden="true" />
          <span className="font-mono text-xs tracking-widest text-coral font-semibold">LIVE</span>
        </div>
        <span className="font-display font-bold text-sm sm:text-base text-chalk-dim">
          QONTROL
        </span>
        <span className="font-mono text-xs text-chalk-dim tabular-nums">HOST&nbsp;READY</span>
      </div>

      <main className="relative flex-1 flex flex-col items-center justify-center px-4 text-center py-16 overflow-hidden">
        <DoodleBackground />
        <CursorTrail />

        <h1 className="relative z-10 font-display font-black text-7xl sm:text-8xl md:text-9xl leading-none tracking-tight mb-5 text-chalk">
          <FlapWord text="QONTROL" />
        </h1>

        <p
          className="relative z-10 font-doodle font-bold text-xl sm:text-2xl mb-10 animate-rise-in"
          style={{ animationDelay: '450ms' }}
        >
          <Scribble type="circle" color="var(--color-amber)" delay={900}>
            <span className="text-amber">SPEED.</span>
          </Scribble>
          <span className="text-chalk-dim"> CONTROL. </span>
          <Scribble type="underline" color="var(--color-coral)" delay={1200}>
            <span className="text-chalk-dim">VICTORY.</span>
          </Scribble>
        </p>

        <div
          className="relative z-10 flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md animate-rise-in"
          style={{ animationDelay: '550ms' }}
        >
          {isAuthenticated ? (
            <Button to="/dashboard" size="lg" className="w-full">
              GO TO HOST DASHBOARD
            </Button>
          ) : (
            <>
              <Button to="/login" size="lg" className="w-full">
                HOST LOGIN
              </Button>
              <Button to="/register" variant="ghost" size="lg" className="w-full">
                REGISTER AS HOST
              </Button>
            </>
          )}
        </div>

        <div
          className="relative z-10 flex flex-wrap justify-center gap-3 mt-12 animate-rise-in"
          style={{ animationDelay: '650ms' }}
        >
          {['SPEED SCORING', 'LIVE LEADERBOARD', 'ROOM CODE JOIN'].map((label) => (
            <span
              key={label}
              className="font-doodle text-sm tracking-wide text-cyan px-3 py-1.5 rounded-full border border-cyan/30 bg-cyan/5 transition-transform hover:-rotate-2 hover:scale-105"
            >
              {label}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}