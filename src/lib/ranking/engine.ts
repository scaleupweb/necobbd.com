import { RANKING_FORMULA_CONFIG } from "../constants";

export interface MatchPerformanceInput {
  isWin: boolean;
  isDraw: boolean;
  goalsScored: number;
  goalsConceded: number;
  isMotm?: boolean;
}

/**
 * Calculates updated player or club rating after a match using configurable weights.
 */
export function calculateNewRating(
  currentRating: number,
  opponentRating: number,
  performance: MatchPerformanceInput
): number {
  const { RATING_K_FACTOR, GOAL_WEIGHT, CLEAN_SHEET_BONUS } = RANKING_FORMULA_CONFIG;

  // Expected score using standard Elo curve
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
  
  // Actual score
  let actualScore = 0;
  if (performance.isWin) actualScore = 1;
  else if (performance.isDraw) actualScore = 0.5;

  let ratingDelta = Math.round(RATING_K_FACTOR * (actualScore - expectedScore));

  // Goal difference factor
  const goalDiff = performance.goalsScored - performance.goalsConceded;
  ratingDelta += Math.round(goalDiff * GOAL_WEIGHT * 10);

  if (performance.goalsConceded === 0) {
    ratingDelta += Math.round(CLEAN_SHEET_BONUS * 5);
  }

  if (performance.isMotm) {
    ratingDelta += 8;
  }

  return Math.max(100, currentRating + ratingDelta);
}

/**
 * Calculates updated form history string (e.g., "W,W,D,W,L")
 */
export function updateFormHistory(currentForm: string, newResult: 'W' | 'D' | 'L'): string {
  const formArray = currentForm ? currentForm.split(',').filter(Boolean) : [];
  formArray.push(newResult);
  // Keep last 5 matches
  const recent = formArray.slice(-5);
  return recent.join(',');
}
