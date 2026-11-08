import MuteButton from '../game/MuteButton';

// The scorebug bar from the landing page, repurposed as the in-game header:
// connection status on the left, room PIN and sound toggle on the right.
const STATUS = {
  connected: { dot: 'bg-coral animate-live-pulse', label: 'LIVE', text: 'text-coral' },
  reconnecting: { dot: 'bg-amber animate-live-pulse', label: 'RECONNECTING', text: 'text-amber' },
  connecting: { dot: 'bg-chalk-dim', label: 'CONNECTING', text: 'text-chalk-dim' },
};

export default function Navbar({ roomCode, connection = 'idle', showMute = true, children }) {
  const status = STATUS[connection];
  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-turf-light bg-turf/60 backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-[7rem]">
        {status && (
          <>
            <span className={`w-2 h-2 rounded-full ${status.dot}`} aria-hidden="true" />
            <span className={`font-mono text-xs tracking-widest font-semibold ${status.text}`} role="status">
              {status.label}
            </span>
          </>
        )}
      </div>
      <span className="font-display font-bold text-sm sm:text-base text-chalk-dim">QONTROL</span>
      <div className="flex items-center justify-end gap-3 min-w-[7rem]">
        {roomCode && (
          <span className="font-mono text-xs sm:text-sm text-chalk-dim tabular-nums" aria-label={`Game PIN ${roomCode}`}>
            PIN {roomCode}
          </span>
        )}
        {children}
        {showMute && <MuteButton />}
      </div>
    </header>
  );
}