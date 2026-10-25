import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handle, limit } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** body: { code, games: [{homePlayerId, awayPlayerId, homeGoals, awayGoals}], proof?, notes?, by? } */
export const POST = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  limit(req, "match-claim", 10, 10 * 60 * 1000);
  const body = (await req.json().catch(() => ({}))) || {};
  return ok(await db.submitMatchClaim(id, String(body.code || ""), { games: Array.isArray(body.games) ? body.games : [], proof: body.proof, notes: body.notes, by: body.by }));
});
