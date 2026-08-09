import DoodleBackground from '../common/DoodleBackground';
import CursorTrail from '../common/CursorTrail';

// Shared chrome for lobby/game/results screens: pitch background, the
// doodle layer + cursor trail, and the same "scorebug" bar the landing
// page uses up top — live pulse on the left, room code centered, a status
// label on the right. Pages just drop their own content in as children.
export default function PageContainer({
  roomCode,
  status,
  doodles = 'sparse',
  cursorTrail = true,
  children,
}) {
  return (
    <div className="relative min-h-screen bg-pitch text-chalk overflow-hidden">
      {doodles && <DoodleBackground variant={doodles} />}
      {cursorTrail && <CursorTrail />}

      {(roomCode || status) && (
        <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-turf-light bg-turf/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-coral animate-live-pulse" aria-hidden="true" />
            <span className="font-mono text-xs tracking-widest text-coral font-semibold">LIVE</span>
          </div>
          {roomCode && (
            <span className="font-mono text-sm sm:text-base tracking-[0.3em] text-amber font-bold">
              {roomCode}
            </span>
          )}
          {status && (
            <span className="font-mono text-xs text-chalk-dim tabular-nums">{status}</span>
          )}
        </div>
      )}

      <main className="relative z-10">{children}</main>
    </div>
  );
}
