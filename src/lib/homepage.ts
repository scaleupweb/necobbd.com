import "server-only";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SiteSettings } from "@/lib/site-settings";

export interface HomeMatch {
  id: string;
  tournament: string;
  label: string;
  isLive: boolean;
  home: { name: string; logo: string };
  away: { name: string; logo: string };
  homeScore: number | null;
  awayScore: number | null;
}

export interface HomeStar {
  id: string;
  category: string;
  iconType: string;
  username: string;
  playerName: string;
  clubName: string;
  clubLogo?: string;
  avatar: string;
  statValue: string;
  statUnit?: string;
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

function sideName(f: any, side: "home" | "away") {
  const p = f[`${side}Player`];
  const c = f[`${side}Club`];
  return { name: p?.fullName || c?.name || "TBD", logo: p?.avatar || c?.logo || "/images/placeholders/club.svg" };
}

function toHomeMatch(f: any): HomeMatch {
  const isLive = f.status === "LIVE";
  const finished = f.status === "FINISHED" && f.result;
  return {
    id: f.id,
    tournament: f.tournamentName || f.round || "Friendly",
    label: isLive ? `LIVE • ${f.minute || "1'"}` : finished ? "FT" : `${formatDate(f.scheduledDate)}`,
    isLive,
    home: sideName(f, "home"),
    away: sideName(f, "away"),
    homeScore: isLive ? f.liveScore.home : finished ? f.result.homeScore : null,
    awayScore: isLive ? f.liveScore.away : finished ? f.result.awayScore : null,
  };
}

/** Weekly awards computed from approved results in the last 7 days (falls back to all-time stats). */
function weeklyStars(players: any[], fixtures: any[]): HomeStar[] {
  const weekAgo = Date.now() - 7 * 86400000;
  const recent = fixtures.filter((f) => f.status === "FINISHED" && f.result?.status === "APPROVED" && new Date(f.scheduledDate).getTime() >= weekAgo);
  const byId = new Map(players.map((p) => [p.id, p]));
  const week = new Map<string, { played: number; wins: number; goals: number; points: number; motm: number; conceded: number }>();

  for (const f of recent) {
    for (const side of ["home", "away"] as const) {
      const p = f[`${side}Player`];
      if (!p) continue;
      const gf = side === "home" ? f.result.homeScore : f.result.awayScore;
      const ga = side === "home" ? f.result.awayScore : f.result.homeScore;
      const w = week.get(p.id) || { played: 0, wins: 0, goals: 0, points: 0, motm: 0, conceded: 0 };
      w.played += 1;
      w.goals += gf;
      w.conceded += ga;
      if (gf > ga) {
        w.wins += 1;
        w.points += 3;
      } else if (gf === ga) w.points += 1;
      if (f.result.motmPlayerId === p.id) w.motm += 1;
      week.set(p.id, w);
    }
  }

  const useWeek = week.size > 0;
  const statsOf = (p: any) =>
    useWeek
      ? week.get(p.id) || { played: 0, wins: 0, goals: 0, points: 0, motm: 0, conceded: 0 }
      : { played: p.stats.matchesPlayed, wins: p.stats.wins, goals: p.stats.goalsScored, points: p.stats.points, motm: p.motmCount, conceded: p.stats.goalsConceded };

  const pool = (useWeek ? [...week.keys()].map((id) => byId.get(id)).filter(Boolean) : players.filter((p) => p.stats.matchesPlayed > 0)) as any[];
  if (!pool.length) return [];

  const used = new Set<string>();
  const pick = (score: (p: any) => number, min = 0) => {
    const sorted = [...pool].filter((p) => score(p) > min).sort((a, b) => score(b) - score(a));
    return sorted.find((p) => !used.has(p.id)) || sorted[0];
  };

  const make = (category: string, iconType: string, p: any, value: string, unit?: string): HomeStar | null => {
    if (!p) return null;
    used.add(p.id);
    return {
      id: `${category}-${p.id}`,
      category,
      iconType,
      username: p.username,
      playerName: p.fullName,
      clubName: p.club?.name || "Free Agent",
      clubLogo: p.club?.logo,
      avatar: p.avatar,
      statValue: value,
      statUnit: unit,
    };
  };

  const potw = pick((p) => statsOf(p).points * 10 + statsOf(p).goals);
  const scorer = pick((p) => statsOf(p).goals);
  const wins = pick((p) => statsOf(p).wins);
  const rate = pick((p) => (statsOf(p).played >= 2 ? statsOf(p).wins / statsOf(p).played : 0));
  const motm = pick((p) => statsOf(p).motm);
  const rising = [...pool].filter((p) => !used.has(p.id)).sort((a, b) => b.rating - a.rating)[0];

  return [
    make("Player of the Week", "crown-gold", potw, String(potw ? statsOf(potw).points : 0), "Pts"),
    scorer && make("Top Scorer", "diamond-blue", scorer, String(statsOf(scorer).goals), "Goals"),
    wins && make("Most Wins", "trophy-green", wins, String(statsOf(wins).wins), "Wins"),
    rate && make("Best Win Rate", "shield-blue", rate, `${Math.round((statsOf(rate).wins / Math.max(statsOf(rate).played, 1)) * 100)}%`),
    motm && make("Man of the Match", "crown-motm", motm, String(statsOf(motm).motm), "Awards"),
    rising && make("Rising Star", "star-orange", rising, String(rising.rating), "Rating"),
  ].filter(Boolean) as HomeStar[];
}

export async function getHomepageData(settings: SiteSettings) {
  const [stats, fixtures, tournaments, activity, players, clubs, listings, news, events, partners] = await Promise.all([
    db.getPlatformStats(),
    db.getFixtures({ limit: 400 }),
    db.getTournaments(),
    db.getActivityEvents(undefined, 6),
    db.getPlayers({ status: "ACTIVE" }),
    db.getClubs({ status: "ACTIVE" }),
    db.getTransferListings(),
    db.getNews(undefined, { limit: 3 }),
    db.getEvents(),
    db.getPartners(),
  ]);

  const live = fixtures.filter((f: any) => f.status === "LIVE");
  const upcoming = fixtures
    .filter((f: any) => f.status === "SCHEDULED" && new Date(f.scheduledDate).getTime() > Date.now() - 3 * 3600000)
    .sort((a: any, b: any) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate));
  const recent = fixtures.filter((f: any) => f.status === "FINISHED");
  const matches = [...live, ...upcoming, ...recent].slice(0, 3).map(toHomeMatch);

  const active = tournaments.filter((t: any) => ["ONGOING", "REGISTRATION_OPEN", "REGISTRATION_CLOSED"].includes(t.status));
  const featured = active.find((t: any) => t.isFeatured) || active.find((t: any) => t.status === "ONGOING") || active[0] || tournaments[0];
  const statusLabel: Record<string, string> = {
    REGISTRATION_OPEN: "Registration Open",
    REGISTRATION_CLOSED: "Starting Soon",
    ONGOING: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  const badges = ["shield-green", "circle-teal", "trophy-slate", "shield-purple"];

  const scorers = players
    .filter((p: any) => p.stats.goalsScored > 0)
    .sort((a: any, b: any) => b.stats.goalsScored - a.stats.goalsScored)
    .slice(0, 5);

  const clubRank = [...clubs].sort((a: any, b: any) => b.points - a.points).slice(0, 5);

  let transferPlayers = listings.slice(0, 5).map((l: any) => ({
    id: l.player.id,
    username: l.player.username,
    name: l.player.fullName,
    avatar: l.player.avatar,
    status: "Transfer Listed",
    marketValue: formatCurrency(l.askingPrice),
  }));
  if (transferPlayers.length < 5) {
    const listedIds = new Set(transferPlayers.map((p) => p.id));
    const extra = players
      .filter((p: any) => !listedIds.has(p.id) && p.contract.status === "FREE_AGENT")
      .slice(0, 5 - transferPlayers.length)
      .map((p: any) => ({ id: p.id, username: p.username, name: p.fullName, avatar: p.avatar, status: "Free Agent", marketValue: formatCurrency(p.marketValue) }));
    transferPlayers = [...transferPlayers, ...extra];
  }

  const upcomingEvents = events.filter((e: any) => e.status === "ACTIVE" && new Date(e.eventDate).getTime() > Date.now()).slice(0, 3);

  let countdownTournament: any = null;
  if (settings.countdown.tournamentId) {
    countdownTournament = tournaments.find((t: any) => t.id === settings.countdown.tournamentId) || null;
  }

  return {
    stats: [
      { value: compact(stats.registeredPlayers), label: settings.hero.statLabels.players },
      { value: compact(stats.activeClubs), label: settings.hero.statLabels.clubs },
      { value: compact(stats.totalTournaments), label: settings.hero.statLabels.tournaments },
      { value: compact(stats.completedMatches), label: settings.hero.statLabels.matches },
    ],
    matches,
    featuredTournament: featured
      ? {
          slug: featured.slug,
          name: featured.name,
          season: featured.season || statusLabel[featured.status] || "",
          image: featured.banner?.startsWith("/images/placeholders") ? "/images/trophy-gold.jpg" : featured.banner,
          playedMatches: featured.completedMatches,
          totalMatches: featured.totalMatches,
          progressPercent: featured.progressPercent,
          participants: featured.currentParticipants,
          maxParticipants: featured.maxParticipants,
          unit: featured.participantType === "CLUB" ? "clubs" : "players",
          prizePool: featured.prizePool,
          isRegistrationOpen: featured.isRegistrationOpen,
        }
      : null,
    tournamentsList: active
      .filter((t: any) => t.id !== featured?.id)
      .slice(0, 4)
      .map((t: any, i: number) => ({
        slug: t.slug,
        name: t.name,
        subtitle: `${statusLabel[t.status] || t.status} • ${t.currentParticipants}/${t.maxParticipants} ${t.participantType === "CLUB" ? "clubs" : "players"}`,
        badgeType: badges[i % badges.length],
      })),
    activities: activity.slice(0, 5).map((a: any) => ({
      id: a.id,
      text: a.title,
      createdAt: a.createdAt,
      avatar: a.avatar || "/images/placeholders/avatar.svg",
      href: a.targetUrl,
    })),
    weeklyStars: weeklyStars(players, fixtures),
    topScorers: scorers.map((p: any, i: number) => ({
      rank: i + 1,
      username: p.username,
      playerName: p.fullName,
      clubShort: p.club?.shortName || "—",
      avatar: p.avatar,
      goals: p.stats.goalsScored,
    })),
    clubRankings: clubRank.map((c: any, i: number) => ({
      rank: i + 1,
      slug: c.slug,
      clubName: c.name,
      logo: c.logo,
      played: c.stats.matches,
      won: c.stats.wins,
      draw: c.stats.draws,
      lost: c.stats.losses,
      points: c.points,
    })),
    transferPlayers,
    news: news.map((n: any) => ({ slug: n.slug, title: n.title, date: formatDate(n.publishedDate), image: n.featuredImage })),
    events: upcomingEvents.map((e: any, i: number) => ({
      slug: e.slug,
      title: e.name,
      date: formatDate(e.eventDate),
      venue: e.venue,
      isRegistrationOpen: e.isRegistrationOpen,
      badgeType: ["gold", "purple", "blue"][i % 3],
    })),
    partners: partners.map((p: any) => ({ name: p.name, category: p.category, logo: p.logo, website: p.website })),
    countdownTournament: countdownTournament
      ? { slug: countdownTournament.slug, name: countdownTournament.name, currentParticipants: countdownTournament.currentParticipants, maxParticipants: countdownTournament.maxParticipants }
      : null,
  };
}

export type HomepageData = Awaited<ReturnType<typeof getHomepageData>>;
