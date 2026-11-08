import { useEffect, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { formatScore } from '../../utils/scoring';

const RANK_TONE = { 1: 'text-amber', 2: 'text-chalk', 3: 'text-coral' };
const SPRING = { type: 'spring', stiffness: 380, damping: 34 };

/**
 * Ranked list. With `animateFromPrevious` it first shows the standings as they
 * were BEFORE this round (score minus points gained), then slides the rows
 * into their new order — the moment players actually watch for.
 * Give it a `key` that changes per round so it replays.
 */
export default function Leaderboard({ entries, meId, animateFromPrevious = false, className = '' }) {
  const [settled, setSettled] = useState(!animateFromPrevious);

  useEffect(() => {
    if (settled) return undefined;
    const id = setTimeout(() => setSettled(true), 900);
    return () => clearTimeout(id);
  }, [settled]);

  const rows = settled
    ? entries
    : [...entries].sort((a, b) => b.score - b.gained - (a.score - a.gained));

  return (
    <LayoutGroup>
      <ol className={`space-y-2 ${className}`}>
        {rows.map((entry, i) => {
          const rank = settled ? entry.rank : i + 1;
          const shownScore = settled ? entry.score : entry.score - entry.gained;
          const mine = entry.playerId === meId;
          return (
            <motion.li
              key={entry.playerId}
              layout
              transition={SPRING}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                mine ? 'border-amber bg-amber/10' : 'border-turf-light bg-turf'
              }`}
            >
              <span className={`w-8 text-center font-mono font-bold text-xl ${RANK_TONE[rank] || 'text-chalk-dim'}`}>
                {rank}
              </span>
              <span className="flex-1 truncate font-display font-semibold text-chalk">
                {entry.nickname}
                {mine && <span className="font-doodle text-amber"> (you)</span>}
              </span>
              {settled && entry.gained > 0 && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono text-sm text-cyan"
                >
                  +{formatScore(entry.gained)}
                </motion.span>
              )}
              <span className="font-mono font-bold tabular-nums text-chalk">{formatScore(shownScore)}</span>
            </motion.li>
          );
        })}
      </ol>
    </LayoutGroup>
  );
}