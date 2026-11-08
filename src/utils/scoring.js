// Display helpers only. The SERVER computes the real score; these just let the
// UI show the same numbers (e.g. "worth 842 pts right now").

/** Mirrors the server: full points if instant, half points at the buzzer. */
export function pointsAvailable(basePoints, remainingMs, totalMs) {
  if (!totalMs) return 0;
  const elapsedRatio = Math.min(1, Math.max(0, 1 - remainingMs / totalMs));
  return Math.round(basePoints * (1 - elapsedRatio / 2));
}

export function formatScore(value) {
  return Number(value || 0).toLocaleString('en-US');
}

export function ordinal(n) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function percent(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}