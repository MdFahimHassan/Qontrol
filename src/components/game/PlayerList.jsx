// Shared roster used by both lobby screens. Kept deliberately plain for
// milestone 2 — no avatars/scores yet, just who's in the room. Score
// columns and podium ranking come with the milestone 3/4 leaderboard work.
export default function PlayerList({ players = [], emptyLabel = 'Waiting for players…' }) {
  if (players.length === 0) {
    return <p className="font-doodle text-chalk-dim text-center py-6">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2 justify-center">
      {players.map((p, i) => (
        <li
          key={p.id ?? p.nickname ?? i}
          className="px-3 py-1.5 rounded-full bg-turf-light border border-turf-light text-sm font-doodle text-chalk animate-rise-in"
        >
          {p.nickname}
        </li>
      ))}
    </ul>
  );
}
