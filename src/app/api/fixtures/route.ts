import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const fixtures = await db.getFixtures({
    status: sp.get("status") || undefined,
    tournamentId: sp.get("tournamentId") || undefined,
    clubId: sp.get("clubId") || undefined,
    playerId: sp.get("playerId") || undefined,
    onStream: sp.get("onStream") === "true",
  });
  return ok(fixtures, 200, { count: fixtures.length });
});
