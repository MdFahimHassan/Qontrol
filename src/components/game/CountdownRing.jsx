import { useEffect } from 'react';
import { useCountdown } from '../../hooks/useCountdown';
import { play } from '../../utils/sound';

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Shrinking ring around the seconds left. Turns coral for the last five seconds.
// `endsAtMs` is a server timestamp; `offsetMs` corrects for the device's clock.
export default function CountdownRing({ endsAtMs, offsetMs = 0, totalSeconds, size = 96, tick = false }) {
  const { remainingMs, seconds } = useCountdown(endsAtMs, offsetMs);
  const fraction = Math.min(1, remainingMs / (Math.max(1, totalSeconds) * 1000));
  const low = seconds <= 5;

  useEffect(() => {
    if (tick && low && seconds > 0) play('tick');
  }, [seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      role="timer"
      aria-label={`${seconds} seconds left`}
      className={`relative shrink-0 rounded-full ${low && seconds > 0 ? 'animate-live-pulse' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--color-turf-light)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={low ? 'var(--color-coral)' : 'var(--color-amber)'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          style={{ transition: 'stroke-dashoffset 120ms linear, stroke 200ms' }}
        />
      </svg>
      <span
        key={seconds}
        className={`animate-flap absolute inset-0 grid place-items-center font-mono font-bold tabular-nums ${low ? 'text-coral' : 'text-chalk'}`}
        style={{ fontSize: size * 0.36 }}
        aria-hidden="true"
      >
        {seconds}
      </span>
    </div>
  );
}