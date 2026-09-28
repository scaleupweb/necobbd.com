import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handle, limit } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  limit(req, "search", 60, 60 * 1000);
  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 80);
  const empty = { players: [], clubs: [], tournaments: [], matches: [], news: [] };
  if (!q) return ok(empty);
  const lq = q.toLowerCase();

  const [players, clubs, tournaments, fixtures, news] = await Promise.all([
    db.getPlayers({ search: q, limit: 6 }),
    db.getClubs({ search: q, status: "ACTIVE" }),
    db.getTournaments(),
    db.getFixtures({ limit: 300 }),
    db.getNews(undefined, { limit: 100 }),
  ]);

  return ok({
    players: players.slice(0, 6).map(({ phone, userId, ...p }: any) => p),
    clubs: clubs.slice(0, 5),
    tournaments: tournaments.filter((t: any) => t.name.toLowerCase().includes(lq) || (t.description || "").toLowerCase().includes(lq)).slice(0, 4),
    matches: fixtures
      .filter(
        (f: any) =>
          f.homePlayer?.fullName.toLowerCase().includes(lq) ||
          f.awayPlayer?.fullName.toLowerCase().includes(lq) ||
          f.homeClub?.name.toLowerCase().includes(lq) ||
          f.awayClub?.name.toLowerCase().includes(lq) ||
          f.tournamentName?.toLowerCase().includes(lq)
      )
      .slice(0, 5),
    news: news.filter((n: any) => n.title.toLowerCase().includes(lq) || (n.excerpt || "").toLowerCase().includes(lq)).slice(0, 4),
  });
});
