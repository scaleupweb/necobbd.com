export interface PlayerValuationMetrics {
  rating: number;
  matchesPlayed: number;
  winRate: number; // 0 to 100
  goalsScored: number;
  motmCount: number;
  cleanSheets: number;
  recentForm: string; // "W,W,W,D,L"
}

/**
 * Calculates a player's virtual market value in Millions USD ($M)
 */
export function calculatePlayerMarketValue(metrics: PlayerValuationMetrics): number {
  // No official matches yet → no market value (shown as "—" on the site).
  if (!metrics.matchesPlayed) return 0;

  // Base value from rating (e.g. 750 rating -> ~35M, 900+ rating -> 120M+)
  let baseValue = Math.max(5, (metrics.rating - 600) * 0.4);

  // Experience factor
  const expMultiplier = Math.min(2.0, 1 + (metrics.matchesPlayed * 0.01));
  baseValue *= expMultiplier;

  // Win rate bonus
  if (metrics.winRate > 60) {
    baseValue += (metrics.winRate - 60) * 1.5;
  }

  // Goal & MOTM bonuses
  baseValue += (metrics.goalsScored * 0.8);
  baseValue += (metrics.motmCount * 3.5);
  baseValue += (metrics.cleanSheets * 1.2);

  // Recent form factor
  if (metrics.recentForm) {
    const winsInForm = (metrics.recentForm.match(/W/g) || []).length;
    baseValue += winsInForm * 2.0;
  }

  // Round to 1 decimal place, minimum $5M
  return Math.max(5.0, Math.round(baseValue * 10) / 10);
}
