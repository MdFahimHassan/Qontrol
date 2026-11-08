import { AnimatePresence, motion } from 'framer-motion';

// Lobby roster. Chips pop in as people join. Pass `onKick` (host only) to get
// a remove button on each chip.
export default function PlayerList({ players, meId, onKick, emptyText = 'Waiting for players…' }) {
  if (!players.length) {
    return <p className="font-doodle text-lg text-chalk-dim">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      <AnimatePresence>
        {players.map((p, i) => {
          const mine = p.id === meId;
          const tilt = ((i % 3) - 1) * 1.2;
          return (
            <motion.li
              key={p.id}
              layout
              initial={{ scale: 0.6, opacity: 0, rotate: tilt }}
              animate={{ scale: 1, opacity: p.connected === false ? 0.45 : 1, rotate: tilt }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              className={`inline-flex items-center gap-2 rounded-full border py-2 pl-4 font-display font-semibold ${
                onKick ? 'pr-2' : 'pr-4'
              } ${mine ? 'border-amber text-amber bg-amber/10' : 'border-turf-light bg-turf text-chalk'}`}
            >
              <span className="max-w-[10rem] truncate">{p.nickname}</span>
              {onKick && (
                <button
                  type="button"
                  onClick={() => onKick(p.id)}
                  aria-label={`Remove ${p.nickname}`}
                  className="grid place-items-center w-6 h-6 rounded-full text-chalk-dim hover:bg-coral/20 hover:text-coral transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}