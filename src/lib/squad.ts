/** Seats in every club's Main Team Squad. */
export const SQUAD_LIMIT = 30;

/** Length of a new player contract, in days. */
export const CONTRACT_DAYS = 120;

/** After joining a club a player is frozen (no activity) for this many days. */
export const FREEZE_DAYS = 3;

/** Club squads. Only the Main Team Squad exists today; more can be added here later. */
export const SQUADS = [{ id: "main", label: "Main Team Squad", size: SQUAD_LIMIT }] as const;

const DAY = 86400000;

/**
 * Which player sits in which seat (index 0 = seat 1). Players with a chosen seat keep it;
 * players without one (older data) fill the lowest free seats in shirt-number order.
 */
export function seatLayout<T extends { seat?: number | null; shirtNo?: number | null; fullName?: string }>(squad: T[], size = SQUAD_LIMIT): (T | null)[] {
  const seats: (T | null)[] = Array.from({ length: size }, () => null);
  const rest: T[] = [];
  for (const p of squad) {
    const s = Number(p.seat || 0);
    if (s >= 1 && s <= size && !seats[s - 1]) seats[s - 1] = p;
    else rest.push(p);
  }
  rest.sort((a, b) => (a.shirtNo || 999) - (b.shirtNo || 999) || String(a.fullName || "").localeCompare(String(b.fullName || "")));
  for (const p of rest) {
    const i = seats.indexOf(null);
    if (i === -1) break;
    seats[i] = p;
  }
  return seats;
}

/** Open seat numbers (1-based). */
export const openSeats = (squad: any[], size = SQUAD_LIMIT) =>
  seatLayout(squad, size)
    .map((p, i) => (p ? 0 : i + 1))
    .filter(Boolean);

/** Whole days left on a contract (0 when expired or unknown). */
export const contractDaysLeft = (endDate?: string | Date | null) => (endDate ? Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / DAY)) : 0);

/** Still frozen after joining? */
export const isFrozen = (frozenUntil?: string | Date | null) => !!frozenUntil && new Date(frozenUntil).getTime() > Date.now();

/** "Free Agent" = had a club contract that has run out. Players who never had one are just "No club". */
export const isFreeAgent = (p: any) => !p?.club && !!p?.contract?.endDate && new Date(p.contract.endDate).getTime() < Date.now();

/** Label for a player without a club. */
export const noClubLabel = (p?: any) => (p && isFreeAgent(p) ? "Free Agent" : "No club");

/** "2d 5h" style countdown until the freeze ends. */
export function freezeLeft(frozenUntil?: string | Date | null) {
  const ms = frozenUntil ? new Date(frozenUntil).getTime() - Date.now() : 0;
  if (ms <= 0) return "";
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / 3600000);
  return d ? `${d}d ${h}h` : `${Math.max(1, h)}h`;
}

/** Everyone starts on the same base rating, so it is only shown once a player has played an official match. */
export const isRated = (p?: any) => (p?.stats?.matchesPlayed || 0) > 0;

/** The rating to show, or "New" before the player's first official match. */
export const ratingText = (p?: any) => (isRated(p) ? String(p.rating) : "New");
