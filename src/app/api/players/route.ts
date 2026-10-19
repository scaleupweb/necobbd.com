import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { publicPlayer } from "@/lib/public";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const sortBy = sp.get("sortBy") || "rating";
  const players = await db.getPlayers({
    position: sp.get("position") || undefined,
    clubId: sp.get("clubId") || undefined,
    status: sp.get("status") || undefined,
    search: sp.get("search") || undefined,
  });

  players.sort((a: any, b: any) => {
    if (sortBy === "goals") return b.stats.goalsScored - a.stats.goalsScored;
    if (sortBy === "winRate") return b.stats.winRate - a.stats.winRate;
    if (sortBy === "marketValue") return b.marketValue - a.marketValue;
    if (sortBy === "motm") return b.motmCount - a.motmCount;
    return b.rating - a.rating;
  });

  // Public listing never exposes contact details.
  const safe = players.map(publicPlayer);
  return ok(safe, 200, { count: safe.length });
});
