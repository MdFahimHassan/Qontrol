// Kahoot-style answer tile. Each of the four slots has its own colour AND
// shape, so the tiles stay distinguishable for colour-blind players.
const TILES = [
  { bg: 'bg-coral', shape: 'triangle', name: 'Triangle' },
  { bg: 'bg-cyan', shape: 'diamond', name: 'Diamond' },
  { bg: 'bg-amber', shape: 'circle', name: 'Circle' },
  { bg: 'bg-violet', shape: 'square', name: 'Square' },
];

function Shape({ kind }) {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" aria-hidden="true" fill="currentColor">
      {kind === 'triangle' && <path d="M12 3 22 20H2z" />}
      {kind === 'diamond' && <path d="M12 2 22 12 12 22 2 12z" />}
      {kind === 'circle' && <circle cx="12" cy="12" r="9.5" />}
      {kind === 'square' && <rect x="3" y="3" width="18" height="18" rx="2" />}
    </svg>
  );
}

const STATE_CLASSES = {
  idle: '',
  selected: 'ring-4 ring-chalk animate-tile-pop',
  correct: 'ring-4 ring-chalk animate-tile-pop',
  wrong: 'opacity-60',
  dimmed: 'opacity-30 saturate-50',
};

const SIZE_CLASSES = {
  md: 'min-h-[4.5rem] px-4 py-3 text-base sm:text-lg',
  lg: 'min-h-[7rem] px-6 py-5 text-xl sm:text-3xl',
};

/**
 * state:  idle | selected | correct | wrong | dimmed
 * Pass `onClick` to make it tappable; leave it off for the host's read-only view.
 * `count` + `total` draw the "how many picked this" bar used on reveal.
 */
export default function AnswerButton({
  index,
  text,
  state = 'idle',
  onClick,
  disabled = false,
  count,
  total,
  size = 'md',
}) {
  const tile = TILES[index % TILES.length];
  const interactive = !!onClick && !disabled;
  const Comp = onClick ? 'button' : 'div';
  const pct = count != null && total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <Comp
      {...(onClick ? { type: 'button', onClick, disabled } : {})}
      aria-label={`${tile.name}: ${text}`}
      aria-pressed={onClick ? state === 'selected' : undefined}
      className={`relative overflow-hidden flex items-center gap-4 w-full text-left rounded-xl font-display font-bold leading-snug text-pitch break-words shadow-[0_5px_0_0_rgba(0,0,0,0.4)] transition-all ${tile.bg} ${SIZE_CLASSES[size]} ${STATE_CLASSES[state]} ${
        interactive ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_2px_0_0_rgba(0,0,0,0.4)]' : ''
      } ${onClick && !interactive ? 'cursor-default' : ''}`}
    >
      <Shape kind={tile.shape} />
      <span className="flex-1">{text}</span>

      {count != null && (
        <span className="font-mono text-lg sm:text-2xl tabular-nums" aria-label={`${count} players`}>
          {count}
        </span>
      )}
      {state === 'correct' && (
        <span className="grid place-items-center w-9 h-9 rounded-full bg-pitch text-chalk shrink-0" aria-label="Correct answer">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      )}
      {state === 'wrong' && (
        <span className="grid place-items-center w-9 h-9 rounded-full bg-pitch text-coral shrink-0" aria-label="Your answer, wrong">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </span>
      )}

      {count != null && (
        <span
          className="absolute left-0 bottom-0 h-1.5 bg-pitch/40"
          style={{ width: `${pct}%`, transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          aria-hidden="true"
        />
      )}
    </Comp>
  );
}