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
  /** Custom club count per group (A, B, C…). Empty = split evenly. */
  groupSizes?: number[];
  /** Extra qualifiers: the best clubs finishing just below the qualifying places (e.g. best 3rd-placed). */
  bestPlaced?: number;
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

/** The group sizes a config uses: the custom sizes when set, otherwise an even split. */
export function sizesFor(c: Pick<CompetitionConfig, "groupCount" | "groupSizes">, clubs: number) {
  if (c.groupSizes?.length) return c.groupSizes;
  return groupSizes(clubs, Math.max(1, c.groupCount));
}

/** Clubs in the first knockout round. */
export const knockoutSize = (c: Pick<CompetitionConfig, "groupCount" | "advancePerGroup" | "bestPlaced">) => c.groupCount * c.advancePerGroup + (c.bestPlaced || 0);

/** "1st", "2nd", "3rd"… */
export const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th"}`;

/** Best-placed clubs needed to fill the next power-of-two bracket (0 when already a power of two or it can't be filled). */
export function autoBestPlaced(groupCount: number, advancePerGroup: number) {
  const base = groupCount * advancePerGroup;
  if (base < 2 || isPowerOfTwo(base)) return 0;
  let n = 2;
  while (n < base) n *= 2;
  return n - base < groupCount ? n - base : 0;
}

export type FormatOption = { groupCount: number; advancePerGroup: number; bestPlaced: number; minSize: number; maxSize: number; bracket: number };

/** Formats that work for `clubs` entrants. Qualifiers make a power-of-two bracket, topped up with best-placed clubs when needed. */
export function suggestFormats(clubs: number): FormatOption[] {
  const out: FormatOption[] = [];
  for (const groupCount of [1, 2, 3, 4, 6, 8, 12, 16, 24, 32]) {
    if (groupCount > clubs / 2) continue;
    const sizes = groupSizes(clubs, groupCount);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    if (maxSize > 10) continue; // groups larger than 10 mean too many matches
    if (groupCount > 1 && minSize < 3) continue; // a group of 2 is just one match
    for (const advancePerGroup of [1, 2, 4]) {
      if (advancePerGroup >= minSize) continue;
      const base = groupCount * advancePerGroup;
      const bestPlaced = autoBestPlaced(groupCount, advancePerGroup);
      if (!isPowerOfTwo(base + bestPlaced)) continue;
      if (bestPlaced && advancePerGroup + 1 > minSize) continue;
      out.push({ groupCount, advancePerGroup, bestPlaced, minSize, maxSize, bracket: base + bestPlaced });
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
  const sizes = sizesFor(c, clubs);
  if (c.groupSizes?.length) {
    if (c.groupSizes.length !== c.groupCount) errs.push(`Set a size for each of the ${c.groupCount} groups.`);
    const total = c.groupSizes.reduce((a, b) => a + b, 0);
    if (total !== clubs) errs.push(`The groups hold ${total} clubs but ${clubs} are approved. Make them add up to ${clubs}.`);
    if (c.groupSizes.some((n) => n < 2)) errs.push("Each group needs at least 2 clubs.");
  }
  const minSize = Math.min(...sizes);
  const best = c.bestPlaced || 0;
  if (c.advancePerGroup >= minSize) errs.push(`Only ${minSize - 1} club(s) can advance from the smallest group (${minSize} clubs).`);
  if (best && best >= c.groupCount) errs.push(`Best-placed qualifiers must be fewer than the number of groups (${c.groupCount}).`);
  else if (best && c.advancePerGroup + 1 > minSize) errs.push(`The smallest group has no ${ordinal(c.advancePerGroup + 1)} place for best-placed qualifiers.`);
  const ko = knockoutSize(c);
  if (!isPowerOfTwo(ko)) {
    const hint = autoBestPlaced(c.groupCount, c.advancePerGroup);
    errs.push(
      `${ko} clubs would reach the knockout, but it needs 2, 4, 8, 16, 32 or 64.` +
        (hint && !best ? ` Add the ${hint} best ${ordinal(c.advancePerGroup + 1)}-placed clubs to make ${ko + hint}.` : "")
    );
  }
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

/** Random group draw: clubs dealt round-robin into groups A, B, C…, each filled up to its size. */
export function drawGroups(clubIds: string[], groupCount: number, rand?: () => number, sizes?: number[]): Group[] {
  const cap = sizes?.length === groupCount ? sizes : groupSizes(clubIds.length, groupCount);
  const groups: Group[] = Array.from({ length: groupCount }, (_, i) => ({ name: groupLetter(i), clubIds: [] }));
  let g = 0;
  for (const id of shuffle(clubIds, rand)) {
    let tries = 0;
    while (groups[g % groupCount].clubIds.length >= cap[g % groupCount] && tries++ < groupCount) g++;
    groups[g % groupCount].clubIds.push(id);
    g++;
  }
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

/** Compare clubs from different groups (groups can differ in size, so per-match averages are used). */
function crossGroupOrder(x: StandingRow, y: StandingRow) {
  const pm = (r: StandingRow, v: number) => (r.played ? v / r.played : 0);
  return (
    pm(y, y.points) - pm(x, x.points) ||
    pm(y, y.pointsFor - y.pointsAgainst) - pm(x, x.pointsFor - x.pointsAgainst) ||
    pm(y, y.goalsFor - y.goalsAgainst) - pm(x, x.goalsFor - x.goalsAgainst) ||
    pm(y, y.goalsFor) - pm(x, x.goalsFor)
  );
}

/** The best clubs at place `place` (0-based) across all groups, best first. */
export function bestAtPlace(tables: { name: string; rows: StandingRow[] }[], place: number, count: number) {
  return tables
    .filter((t) => t.rows[place])
    .map((t) => ({ row: t.rows[place], group: t.name }))
    .sort((a, b) => crossGroupOrder(a.row, b.row))
    .slice(0, count);
}

/**
 * First knockout round from the group tables, in bracket order (consecutive pairs meet in the next round).
 * Group winners face lower-placed clubs, and clubs from the same group don't meet in the first round
 * whenever that can be avoided.
 */
export function firstKnockoutPairs(tables: { name: string; rows: StandingRow[] }[], advancePerGroup: number, bestPlaced = 0): [string, string][] {
  if (tables.length === 1) {
    const seeds = tables[0].rows.slice(0, advancePerGroup + bestPlaced).map((r) => r.clubId);
    const order = bracketSeedOrder(seeds.length);
    const pairs: [string, string][] = [];
    for (let i = 0; i < order.length; i += 2) pairs.push([seeds[order[i] - 1], seeds[order[i + 1] - 1]]);
    return pairs;
  }
  if (advancePerGroup === 2 && !bestPlaced && tables.length % 2 === 0) {
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
  // General case: all 1st places (best first), then all 2nds, …, then the best-placed; seeded into a standard bracket.
  const seeds: { id: string; group: string }[] = [];
  for (let place = 0; place < advancePerGroup; place++) {
    for (const x of bestAtPlace(tables, place, tables.length)) seeds.push({ id: x.row.clubId, group: x.group });
  }
  if (bestPlaced) for (const x of bestAtPlace(tables, advancePerGroup, bestPlaced)) seeds.push({ id: x.row.clubId, group: x.group });
  const order = bracketSeedOrder(seeds.length);
  const pairs: { id: string; group: string }[][] = [];
  for (let i = 0; i < order.length; i += 2) pairs.push([seeds[order[i] - 1], seeds[order[i + 1] - 1]]);
  // Avoid same-group first-round meetings by swapping the lower-seeded clubs between ties.
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0].group !== pairs[i][1].group) continue;
    for (let j = 0; j < pairs.length; j++) {
      if (j === i) continue;
      if (pairs[j][0].group !== pairs[i][1].group && pairs[i][0].group !== pairs[j][1].group) {
        [pairs[i][1], pairs[j][1]] = [pairs[j][1], pairs[i][1]];
        break;
      }
    }
  }
  return pairs.map(([a, b]) => [a.id, b.id] as [string, string]);
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
