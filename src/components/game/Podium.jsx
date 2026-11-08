import { motion } from 'framer-motion';
import { formatScore } from '../../utils/scoring';

// Visual order is 2nd, 1st, 3rd. The bars rise 3rd -> 2nd -> 1st: one
// orchestrated reveal, then the names and scores settle in.
const SLOTS = [
  { index: 1, height: 150, delay: 0.9, bar: 'bg-cyan' },
  { index: 0, height: 210, delay: 1.6, bar: 'bg-amber' },
  { index: 2, height: 110, delay: 0.2, bar: 'bg-coral' },
];

export default function Podium({ entries, meId }) {
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4" role="list" aria-label="Top three players">
      {SLOTS.map(({ index, height, delay, bar }) => {
        const entry = entries[index];
        if (!entry) return <div key={index} className="w-24 sm:w-40" aria-hidden="true" />;
        const mine = entry.playerId === meId;
        return (
          <div key={entry.playerId} role="listitem" className="flex flex-col items-center w-24 sm:w-40">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.5, duration: 0.4 }}
              className="flex flex-col items-center text-center mb-2 max-w-full"
            >
              {index === 0 && (
                <img src="/doodles/crown.png" alt="" aria-hidden="true" className="w-14 h-14 mb-1 doodle-float" style={{ '--doodle-rot': '-6deg' }} />
              )}
              <span
                className={`font-display font-bold truncate max-w-full ${index === 0 ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'} ${
                  mine ? 'text-amber' : 'text-chalk'
                }`}
              >
                {entry.nickname}
              </span>
              <span className="font-mono text-sm sm:text-base text-chalk-dim tabular-nums">
                {formatScore(entry.score)}
              </span>
            </motion.div>
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ height, transformOrigin: 'bottom' }}
              className={`w-full rounded-t-xl grid place-items-start justify-center pt-3 shadow-[0_5px_0_0_rgba(0,0,0,0.4)] ${bar} ${
                mine ? 'ring-4 ring-chalk' : ''
              }`}
            >
              <span className="font-display font-black text-4xl text-pitch">{entry.rank}</span>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}