import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, TOURNAMENT_STAFF } from "@/lib/auth";
import { ok, fail, handle, audit } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  await requireRole(TOURNAMENT_STAFF);
  const data = await db.getCompetition(id);
  return data ? ok(data) : fail("Tournament not found", 404);
});

/** Save the competition settings. */
export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(TOURNAMENT_STAFF);
  const body = await req.json();
  const data = await db.saveCompetitionConfig(id, body || {});
  await audit(req, session, "COMPETITION_CONFIG", `Tournament ${id}`, JSON.stringify(body).slice(0, 300));
  return ok(data);
});

/** body: { action: "DRAW", groups? } | { action: "FIXTURES" } | { action: "ADVANCE" } | { action: "RESET" } */
export const POST = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(TOURNAMENT_STAFF);
  const { action, groups } = await req.json();
  let data;
  if (action === "DRAW") {
    const manual = Array.isArray(groups)
      ? groups.map((g: any) => ({ name: String(g?.name || ""), clubIds: Array.isArray(g?.clubIds) ? g.clubIds.map(String) : [] }))
      : undefined;
    data = await db.drawCompetitionGroups(id, manual);
  } else if (action === "FIXTURES") data = await db.generateGroupFixtures(id);
  else if (action === "ADVANCE") data = await db.advanceCompetition(id);
  else if (action === "RESET") data = await db.resetCompetition(id);
  else return fail("Invalid action");
  await audit(req, session, `COMPETITION_${action}`, `Tournament ${id}`, groups ? "manual draw" : "");
  return ok(data);
});
