// Club competition engine: groups → round-robin fixtures → points table → knockout bracket.
// Pure functions only (no database), shared by the server and the admin/public pages.
//
// A "tie" is one club-vs-club match. It is made of up to `playersPerTie` individual 1v1 games;
// each game gives the winner 3 internal points (1 each for a draw). The club with more internal
// points wins the tie and earns 3 league points (1 each for a level tie).

export type CompetitionConfig = {
  enabled: boolean;
  groupCount: number;
  advancePerGroup: number;
  groupLegs: 1 | 2;
  knockoutLegs: 1 | 2;
  finalLegs: 1 | 2;
  playersPerTie: number;
  firstMatchday?: string; // ISO date of round 1
  daysBetweenRounds: number;
};

export type Group = { name: string; clubIds: string[] };

export type Competition = CompetitionConfig & {
  stage: "SETUP" | "GROUPS" | "KNOCKOUT" | "COMPLETED";
  groups: Group[];
  drawnAt?: string;
};

export const DEFAULT_COMPETITION: Competition = {
  enabled: false,
  groupCount: 8,
  advancePerGroup: 2,
  groupLegs: 1,
  knockoutLegs: 1,
  finalLegs: 1,
  playersPerTie: 10,
  daysBetweenRounds: 2,
  stage: "SETUP",
  groups: [],
};

export const GAME_WIN_POINTS = 3;
export const GAME_DRAW_POINTS = 1;
export const TIE_WIN_POINTS = 3;
export const TIE_DRAW_POINTS = 1;

export const isPowerOfTwo = (n: number) => n >= 2 && (n & (n - 1)) === 0;
export const groupLetter = (i: number) => String.fromCharCode(65 + i);

/** Name of a knockout round by how many clubs are left in it. */
export function knockoutRoundName(clubsLeft: number) {
  if (clubsLeft === 2) return "Final";
  if (clubsLeft === 4) return "Semi-final";
  if (clubsLeft === 8) return "Quarter-final";
  return `Round of ${clubsLeft}`;
}

/** Group sizes for `clubs` split into `groups` as evenly as possible (e.g. 46 into 8 → 6,6,6,6,6,6,5,5). */
export function groupSizes(clubs: number, groups: number) {
  const base = Math.floor(clubs / groups);
  const extra = clubs % groups;
  return Array.from({ length: groups }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Matches one club plays in a group of `size` (every other club, once or twice). */
export const matchesPerClub = (size: number, legs: number) => (size - 1) * legs;

/** Formats that work for `clubs` entrants: qualifiers must make a power-of-two bracket. */
export function suggestFormats(clubs: number) {
  const out: { groupCount: number; advancePerGroup: number; minSize: number; maxSize: number; bracket: number }[] = [];
  for (const groupCount of [1, 2, 4, 8, 16, 32]) {
    if (groupCount > clubs / 2) continue;
    const sizes = groupSizes(clubs, groupCount);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    if (maxSize > 10) continue; // groups larger than 10 mean too many matches
    for (const advancePerGroup of [1, 2, 4]) {
      const bracket = groupCount * advancePerGroup;
      if (advancePerGroup >= minSize || !isPowerOfTwo(bracket)) continue;
      out.push({ groupCount, advancePerGroup, minSize, maxSize, bracket });
    }
  }
  return out;
}

/** Problems with a config for this many clubs (empty when it's usable). */
export function validateConfig(c: CompetitionConfig, clubs: number): string[] {
  const errs: string[] = [];
  if (clubs < 2) errs.push("At least 2 approved clubs are needed.");
  if (c.groupCount < 1) errs.push("Choose at least 1 group.");
  if (c.groupCount > clubs / 2) errs.push(`${c.groupCount} groups is too many for ${clubs} clubs (each group needs 2+).`);
  const minSize = Math.min(...groupSizes(clubs, Math.max(1, c.groupCount)));
  if (c.advancePerGroup >= minSize) errs.push(`Only ${minSize - 1} club(s) can advance from the smallest group (${minSize} clubs).`);
  if (!isPowerOfTwo(c.groupCount * c.advancePerGroup)) errs.push(`${c.groupCount} groups × ${c.advancePerGroup} advancing = ${c.groupCount * c.advancePerGroup} clubs; the knockout needs 2, 4, 8, 16, 32 or 64.`);
  if (c.playersPerTie < 1 || c.playersPerTie > 30) errs.push("Players per match must be between 1 and 30.");
  return errs;
}

/** Shuffle (Fisher–Yates) with an optional seeded RNG for repeatable draws. */
export function shuffle<T>(items: T[], rand: () => number = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Random group draw: clubs dealt round-robin into groups A, B, C… */
export function drawGroups(clubIds: string[], groupCount: number, rand?: () => number): Group[] {
  const groups: Group[] = Array.from({ length: groupCount }, (_, i) => ({ name: groupLetter(i), clubIds: [] }));
  shuffle(clubIds, rand).forEach((id, i) => groups[i % groupCount].clubIds.push(id));
  return groups;
}

/**
 * Round-robin schedule (circle method). Returns rounds of [home, away] pairs; with 2 legs the
 * second half repeats every pairing with home and away swapped. Odd groups get a bye each round.
 */
export function roundRobin(clubIds: string[], legs: 1 | 2): [string, string][][] {
  const teams: (string | null)[] = [...clubIds];
  if (teams.length % 2) teams.push(null);
  const n = teams.length;
  const rounds: [string, string][][] = [];
  const arr = [...teams];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a && b) pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    arr.splice(1, 0, arr.pop()!); // rotate, keeping the first team fixed
  }
  if (legs === 2) return [...rounds, ...rounds.map((pairs) => pairs.map(([h, a]) => [a, h] as [string, string]))];
  return rounds;
}

export type Game = { homePlayerId?: string; awayPlayerId?: string; homeGoals: number; awayGoals: number };

/** Internal points and goals of a tie from its individual games. */
export function scoreGames(games: Game[]) {
  let homePoints = 0;
  let awayPoints = 0;
  let homeGoals = 0;
  let awayGoals = 0;
  for (const g of games) {
    const h = Number(g.homeGoals) || 0;
    const a = Number(g.awayGoals) || 0;
    homeGoals += h;
    awayGoals += a;
    if (h > a) homePoints += GAME_WIN_POINTS;
    else if (a > h) awayPoints += GAME_WIN_POINTS;
    else {
      homePoints += GAME_DRAW_POINTS;
      awayPoints += GAME_DRAW_POINTS;
    }
  }
  return { homePoints, awayPoints, homeGoals, awayGoals };
}

export type TieResult = { homeClubId: string; awayClubId: string; homePoints: number; awayPoints: number; homeGoals: number; awayGoals: number };

export type StandingRow = {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number; // internal points
  pointsAgainst: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number; // league points
  form: ("W" | "D" | "L")[];
};

/** Group table, sorted: league points → internal point difference → goal difference → goals scored. */
export function standings(clubIds: string[], results: TieResult[]): StandingRow[] {
  const rows = new Map<string, StandingRow>(
    clubIds.map((id) => [id, { clubId: id, played: 0, won: 0, drawn: 0, lost: 0, pointsFor: 0, pointsAgainst: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: [] }])
  );
  for (const r of results) {
    const h = rows.get(r.homeClubId);
    const a = rows.get(r.awayClubId);
    if (!h || !a) continue;
    h.played++;
    a.played++;
    h.pointsFor += r.homePoints;
    h.pointsAgainst += r.awayPoints;
    a.pointsFor += r.awayPoints;
    a.pointsAgainst += r.homePoints;
    h.goalsFor += r.homeGoals;
    h.goalsAgainst += r.awayGoals;
    a.goalsFor += r.awayGoals;
    a.goalsAgainst += r.homeGoals;
    if (r.homePoints > r.awayPoints) {
      h.won++;
      a.lost++;
      h.points += TIE_WIN_POINTS;
      h.form.push("W");
      a.form.push("L");
    } else if (r.awayPoints > r.homePoints) {
      a.won++;
      h.lost++;
      a.points += TIE_WIN_POINTS;
      a.form.push("W");
      h.form.push("L");
    } else {
      h.drawn++;
      a.drawn++;
      h.points += TIE_DRAW_POINTS;
      a.points += TIE_DRAW_POINTS;
      h.form.push("D");
      a.form.push("D");
    }
  }
  return [...rows.values()].sort(
    (x, y) =>
      y.points - x.points ||
      y.pointsFor - y.pointsAgainst - (x.pointsFor - x.pointsAgainst) ||
      y.goalsFor - y.goalsAgainst - (x.goalsFor - x.goalsAgainst) ||
      y.goalsFor - x.goalsFor
  );
}

/** Standard bracket order of seeds 1..n so the top seeds can only meet late (8 → 1,8,4,5,2,7,3,6). */
export function bracketSeedOrder(n: number): number[] {
  let order = [1, 2];
  while (order.length < n) {
    const m = order.length * 2 + 1;
    order = order.flatMap((s) => [s, m - s]);
  }
  return order;
}

/**
 * First knockout round from the group tables, in bracket order (consecutive pairs meet in the next round).
 * Group winners always face lower-placed clubs, never a club from their own group, and clubs from the
 * same group start in different halves of the bracket.
 */
export function firstKnockoutPairs(tables: { name: string; rows: StandingRow[] }[], advancePerGroup: number): [string, string][] {
  if (tables.length === 1) {
    const seeds = tables[0].rows.slice(0, advancePerGroup).map((r) => r.clubId);
    const order = bracketSeedOrder(seeds.length);
    const pairs: [string, string][] = [];
    for (let i = 0; i < order.length; i += 2) pairs.push([seeds[order[i] - 1], seeds[order[i + 1] - 1]]);
    return pairs;
  }
  if (advancePerGroup === 2) {
    // A1–B2 and C1–D2 … in the top half, B1–A2 and D1–C2 … in the bottom half.
    const top: [string, string][] = [];
    const bottom: [string, string][] = [];
    for (let i = 0; i < tables.length; i += 2) {
      const a = tables[i];
      const b = tables[i + 1];
      top.push([a.rows[0].clubId, b.rows[1].clubId]);
      bottom.push([b.rows[0].clubId, a.rows[1].clubId]);
    }
    return [...top, ...bottom];
  }
  // General case: all 1st places (by group), then all 2nds, …; seeded into a standard bracket.
  const seeds: string[] = [];
  for (let place = 0; place < advancePerGroup; place++) for (const t of tables) seeds.push(t.rows[place].clubId);
  const order = bracketSeedOrder(seeds.length);
  const pairs: [string, string][] = [];
  for (let i = 0; i < order.length; i += 2) pairs.push([seeds[order[i] - 1], seeds[order[i + 1] - 1]]);
  return pairs;
}

/** Winner of a knockout tie over one or two legs: aggregate internal points, then aggregate goals, then the admin's pick. */
export function tieWinner(
  legs: { homeClubId: string; awayClubId: string; homePoints: number; awayPoints: number; homeGoals: number; awayGoals: number; decider?: string }[],
  clubA: string,
  clubB: string
): { winner?: string; aPoints: number; bPoints: number; aGoals: number; bGoals: number; level: boolean } {
  let aPoints = 0;
  let bPoints = 0;
  let aGoals = 0;
  let bGoals = 0;
  let decider: string | undefined;
  for (const l of legs) {
    const aHome = l.homeClubId === clubA;
    aPoints += aHome ? l.homePoints : l.awayPoints;
    bPoints += aHome ? l.awayPoints : l.homePoints;
    aGoals += aHome ? l.homeGoals : l.awayGoals;
    bGoals += aHome ? l.awayGoals : l.homeGoals;
    if (l.decider) decider = l.decider;
  }
  const level = aPoints === bPoints && aGoals === bGoals;
  const winner = aPoints !== bPoints ? (aPoints > bPoints ? clubA : clubB) : aGoals !== bGoals ? (aGoals > bGoals ? clubA : clubB) : decider;
  return { winner, aPoints, bPoints, aGoals, bGoals, level };
}

/** Date of a round: first matchday + (round index × days between rounds), at 21:00 local. */
export function roundDate(first: string | undefined, roundIndex: number, daysBetween: number) {
  const d = first ? new Date(first) : new Date();
  d.setDate(d.getDate() + roundIndex * Math.max(1, daysBetween));
  if (!first) d.setHours(21, 0, 0, 0);
  return d;
}
