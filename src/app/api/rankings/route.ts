import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { publicClub, publicPlayer } from "@/lib/public";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const type = req.nextUrl.searchParams.get("type") || "players";

  if (type === "clubs") {
    const clubs = await db.getClubs({ status: "ACTIVE" });
    // Only clubs that have played an official match are ranked.
    const ranked = clubs.filter((c: any) => c.stats.matches > 0);
    ranked.sort((a: any, b: any) => b.points - a.points || b.stats.goalsScored - b.stats.goalsConceded - (a.stats.goalsScored - a.stats.goalsConceded));
    return ok(ranked.map(publicClub));
  }

  if (type === "referees") {
    const refs = await db.getReferees();
    return ok(refs.sort((a: any, b: any) => b.rating - a.rating));
  }

  const players = (await db.getPlayers({ status: "ACTIVE" })).map(publicPlayer);
  const played = players.filter((p: any) => p.stats.matchesPlayed > 0);

  switch (type) {
    case "scorers":
      return ok(played.sort((a: any, b: any) => b.stats.goalsScored - a.stats.goalsScored).slice(0, 50));
    case "assists":
      return ok(played.sort((a: any, b: any) => b.stats.assists - a.stats.assists).slice(0, 50));
    case "clean-sheets":
      return ok(played.filter((p: any) => p.stats.cleanSheets > 0).sort((a: any, b: any) => b.stats.cleanSheets - a.stats.cleanSheets));
    case "motm":
      return ok(players.filter((p: any) => p.motmCount > 0).sort((a: any, b: any) => b.motmCount - a.motmCount).slice(0, 50));
    default:
      // Ratings only mean something once a player has played: everyone starts on the same base rating.
      return ok(played.sort((a: any, b: any) => b.rating - a.rating));
  }
});
