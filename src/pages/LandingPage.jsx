import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Split-flap letter tile — the product's signature motion, used here for the
// hero wordmark. Each letter flips in on a staggered delay like a departure
// board resolving. Respects prefers-reduced-motion via the global CSS rule.
function FlapLetter({ char, delay }) {
  return (
    <span
      className="animate-flap inline-block"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  );
}

function FlapWord({ text, startDelay = 0 }) {
  return (
    <span className="inline-block" style={{ perspective: '400px' }}>
      {text.split('').map((char, i) => (
        <FlapLetter key={i} char={char} delay={startDelay + i * 45} />
      ))}
    </span>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

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

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-16">
        <h1 className="font-display font-black text-7xl sm:text-8xl md:text-9xl leading-none tracking-tight mb-5 text-chalk">
          <FlapWord text="QONTROL" />
        </h1>

        <p
          className="font-display font-semibold text-lg sm:text-xl mb-10 animate-rise-in"
          style={{ animationDelay: '450ms' }}
        >
          <span className="text-chalk-dim">SPEED. </span>
          <span className="text-amber">CONTROL. </span>
          <span className="text-chalk-dim">VICTORY.</span>
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md animate-rise-in"
          style={{ animationDelay: '550ms' }}
        >
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full py-4 px-6 flex items-center justify-center text-center font-display font-bold text-lg text-pitch bg-amber rounded-lg hover:bg-amber-dim transition-colors shadow-[0_0_24px_-6px_rgba(255,182,39,0.5)]"
            >
              GO TO HOST DASHBOARD
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="w-full py-4 px-6 flex items-center justify-center text-center font-display font-bold text-lg text-pitch bg-amber rounded-lg hover:bg-amber-dim transition-colors shadow-[0_0_24px_-6px_rgba(255,182,39,0.5)]"
              >
                HOST LOGIN
              </Link>
              <Link
                to="/register"
                className="w-full py-4 px-6 flex items-center justify-center text-center font-display font-bold text-lg text-chalk bg-turf border border-turf-light rounded-lg hover:bg-turf-light transition-colors"
              >
                REGISTER AS HOST
              </Link>
            </>
          )}
        </div>

        <div
          className="flex flex-wrap justify-center gap-3 mt-12 animate-rise-in"
          style={{ animationDelay: '650ms' }}
        >
          {['SPEED SCORING', 'LIVE LEADERBOARD', 'ROOM CODE JOIN'].map((label) => (
            <span
              key={label}
              className="font-mono text-[11px] tracking-widest text-cyan px-3 py-1.5 rounded-full border border-cyan/30 bg-cyan/5"
            >
              {label}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}