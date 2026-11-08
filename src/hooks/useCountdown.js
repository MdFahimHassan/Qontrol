import { useEffect, useState } from 'react';

/**
 * Counts down to `endsAtMs` (a SERVER timestamp). `offsetMs` is
 * serverNow - clientNow, so a phone with a wrong clock still shows the
 * right time. The server owns the real deadline; this is display only.
 */
export function useCountdown(endsAtMs, offsetMs = 0, intervalMs = 100) {
  const compute = () => (endsAtMs == null ? 0 : Math.max(0, endsAtMs - (Date.now() + offsetMs)));
  const [remainingMs, setRemainingMs] = useState(compute);

  useEffect(() => {
    setRemainingMs(compute());
    if (endsAtMs == null) return undefined;
    const id = setInterval(() => {
      const remaining = compute();
      setRemainingMs(remaining);
      if (remaining <= 0) clearInterval(id);
    }, intervalMs);
    return () => clearInterval(id);
  }, [endsAtMs, offsetMs, intervalMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return { remainingMs, seconds: Math.ceil(remainingMs / 1000), expired: remainingMs <= 0 };
}