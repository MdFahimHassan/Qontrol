// Split-flap display: each character sits on its own tile and flips whenever
// it changes — the same motion as the landing-page wordmark, reused for the
// PIN, scores and player counts.
const SIZES = {
  sm: 'w-6 h-8 text-base rounded',
  md: 'w-9 h-12 text-2xl rounded-md',
  lg: 'w-12 h-[4.5rem] text-4xl rounded-lg',
  xl: 'w-12 h-[4.5rem] text-4xl sm:w-[4.5rem] sm:h-28 sm:text-7xl rounded-lg',
};

const TONES = {
  chalk: 'text-chalk',
  amber: 'text-amber',
  coral: 'text-coral',
  cyan: 'text-cyan',
};

// A hairline "seam" across the middle gives the flap look without extra markup.
const SEAM =
  'linear-gradient(180deg, var(--color-turf-light) 0%, var(--color-turf-light) 49%, #08100d 49%, #08100d 51%, var(--color-turf) 51%, var(--color-turf) 100%)';

export default function FlapText({ value, size = 'md', tone = 'chalk', className = '' }) {
  const text = String(value ?? '');
  return (
    <span
      role="text"
      aria-label={text}
      className={`inline-flex gap-1 ${className}`}
      style={{ perspective: '500px' }}
    >
      {text.split('').map((char, i) => (
        <span
          key={`${i}-${char}`}
          aria-hidden="true"
          className={`animate-flap inline-flex items-center justify-center border border-turf-light font-mono font-bold tabular-nums ${SIZES[size]} ${TONES[tone]}`}
          style={{ background: SEAM }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}