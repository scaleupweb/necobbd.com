// Derives profile insights (form, streaks, monthly load, snapshot, about text)
// from a player's finished fixtures. Pure functions — safe on server or client.

export type MatchLine = {
  id: string;
  date: string;
  gf: number;
  ga: number;
  result: "W" | "D" | "L";
  opponent: string;
  opponentAvatar: string;
  opponentUsername?: string;
  tournament?: string;
  round?: string;
  motm: boolean;
};

export function toMatchLines(fixtures: any[], playerId: string): MatchLine[] {
  return fixtures
    .filter((f) => f.status === "FINISHED" && f.result?.status === "APPROVED" && (f.homePlayer?.id === playerId || f.awayPlayer?.id === playerId))
    .map((f) => {
      const home = f.homePlayer?.id === playerId;
      const gf = home ? f.result.homeScore : f.result.awayScore;
      const ga = home ? f.result.awayScore : f.result.homeScore;
      let result: MatchLine["result"] = gf > ga ? "W" : gf < ga ? "L" : "D";
      if (gf === ga && f.result.homePenalties != null && f.result.awayPenalties != null && f.result.homePenalties !== f.result.awayPenalties) {
        const myPens = home ? f.result.homePenalties : f.result.awayPenalties;
        const theirPens = home ? f.result.awayPenalties : f.result.homePenalties;
        result = myPens > theirPens ? "W" : "L";
      }
      const opp = home ? f.awayPlayer : f.homePlayer;
      return {
        id: f.id,
        date: f.scheduledDate,
        gf,
        ga,
        result,
        opponent: opp?.fullName || "Unknown",
        opponentAvatar: opp?.avatar || "/images/placeholders/avatar.svg",
        opponentUsername: opp?.username,
        tournament: f.tournamentName,
        round: f.round,
        motm: f.result.motmPlayerId === playerId,
      };
    })
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

const DAY = 86400000;

export function snapshot(lines: MatchLine[]) {
  if (!lines.length) return null;
  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) gaps.push((+new Date(lines[i].date) - +new Date(lines[i - 1].date)) / DAY);
  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const maxGap = gaps.length ? Math.max(...gaps) : 0;

  // Longest run without a loss.
  let best = { len: 0, from: "", to: "" };
  let cur = { len: 0, from: "" };
  for (const m of lines) {
    if (m.result !== "L") {
      if (!cur.len) cur.from = m.date;
      cur.len++;
      if (cur.len > best.len) best = { len: cur.len, from: cur.from, to: m.date };
    } else cur = { len: 0, from: "" };
  }

  const topGoals = [...lines].sort((a, b) => b.gf - a.gf || +new Date(b.date) - +new Date(a.date))[0];
  const biggestWin = [...lines].filter((m) => m.result === "W").sort((a, b) => b.gf - b.ga - (a.gf - a.ga))[0];

  return {
    debut: lines[0].date,
    lastPlayed: lines[lines.length - 1].date,
    avgGapDays: avgGap,
    maxGapDays: maxGap,
    unbeaten: best,
    topGoals,
    biggestWin,
  };
}

export function humanGap(days: number) {
  if (!days) return "—";
  if (days < 1) return `${Math.round(days * 24)} hours`;
  if (days < 14) return `${days.toFixed(1)} days`;
  if (days < 60) return `${(days / 7).toFixed(1)} weeks`;
  return `${(days / 30).toFixed(1)} months`;
}

/** Matches, wins and goals per calendar month (last 12 months with activity). */
export function monthlyLoad(lines: MatchLine[]) {
  const map = new Map<string, { key: string; label: string; matches: number; wins: number; goals: number }>();
  for (const m of lines) {
    const d = new Date(m.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const row = map.get(key) || { key, label, matches: 0, wins: 0, goals: 0 };
    row.matches++;
    if (m.result === "W") row.wins++;
    row.goals += m.gf;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key)).slice(-12);
}

/** Per-season (year) record. */
export function seasons(lines: MatchLine[]) {
  const map = new Map<string, { season: string; matches: number; wins: number; draws: number; losses: number; gf: number; ga: number; motm: number }>();
  for (const m of lines) {
    const season = String(new Date(m.date).getFullYear());
    const r = map.get(season) || { season, matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, motm: 0 };
    r.matches++;
    if (m.result === "W") r.wins++;
    else if (m.result === "D") r.draws++;
    else r.losses++;
    r.gf += m.gf;
    r.ga += m.ga;
    if (m.motm) r.motm++;
    map.set(season, r);
  }
  return [...map.values()].sort((a, b) => b.season.localeCompare(a.season));
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** A readable summary paragraph for the "About" section. */
export function aboutText(p: any, rank: number | null, totalPlayers: number, lines: MatchLine[], snap: ReturnType<typeof snapshot>, titles: number, siteName: string) {
  const s = p.stats;
  const parts: string[] = [];
  parts.push(
    `${p.fullName} (@${p.username}) is a ${siteName} player${p.club ? ` registered with ${p.club.name}` : " currently without a club"}${p.location ? `, based in ${p.location}` : ""}.`
  );
  if (!lines.length) {
    parts.push(`No official matches have been recorded yet. Stats, form and rankings will appear here after the first approved result.`);
    return parts;
  }
  parts.push(
    `Across ${s.matchesPlayed} official matches they have ${s.wins} wins, ${s.draws} draws and ${s.losses} losses (${s.winRate}% win rate), scoring ${s.goalsScored} goals and conceding ${s.goalsConceded}, with ${s.cleanSheets} clean sheets and ${p.motmCount} Man of the Match award${p.motmCount === 1 ? "" : "s"}.`
  );
  if (rank) parts.push(`They currently hold overall rank #${rank} of ${totalPlayers} ranked players with a rating of ${p.rating}.`);
  if (snap) {
    parts.push(`Their official record started on ${fmt(snap.debut)} and the latest match was on ${fmt(snap.lastPlayed)}.`);
    if (snap.unbeaten.len >= 2) parts.push(`The best unbeaten run is ${snap.unbeaten.len} matches, from ${fmt(snap.unbeaten.from)} to ${fmt(snap.unbeaten.to)}.`);
    if (snap.topGoals?.gf) parts.push(`The highest-scoring performance is ${snap.topGoals.gf} goals against ${snap.topGoals.opponent} on ${fmt(snap.topGoals.date)}.`);
    if (snap.biggestWin) parts.push(`The biggest win is ${snap.biggestWin.gf}-${snap.biggestWin.ga} against ${snap.biggestWin.opponent}.`);
  }
  if (titles) parts.push(`Honours: ${titles} tournament title${titles === 1 ? "" : "s"}.`);
  return parts;
}
