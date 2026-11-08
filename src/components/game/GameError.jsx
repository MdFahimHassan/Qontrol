import { useEffect } from 'react';

// Inline, self-dismissing note for errors that don't end the game
// (e.g. "wait for at least one player", "connection lost").
export default function GameError({ error, onDismiss }) {
  useEffect(() => {
    if (!error) return undefined;
    const id = setTimeout(() => onDismiss?.(), 4500);
    return () => clearTimeout(id);
  }, [error, onDismiss]);

  if (!error) return null;
  return (
    <p role="alert" className="rounded-lg border border-coral/30 bg-coral/10 px-4 py-2 text-sm text-coral">
      {error.message}
    </p>
  );
}