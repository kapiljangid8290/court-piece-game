export type PlayerStats = {
  gamesPlayed: number;
  gamesWon: number;
  totalBids: number;
};

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalBids: 0,
};

export function getPlayerStats(name: string): PlayerStats {
  if (!name) return DEFAULT_STATS;

  const raw = localStorage.getItem(`stats:${name}`);
  return raw ? JSON.parse(raw) : DEFAULT_STATS;
}

export function savePlayerStats(name: string, stats: PlayerStats) {
  localStorage.setItem(`stats:${name}`, JSON.stringify(stats));
}

export function incrementStat(
  name: string,
  field: keyof PlayerStats,
  value = 1
) {
  const stats = getPlayerStats(name);
  stats[field] += value;
  savePlayerStats(name, stats);
}
