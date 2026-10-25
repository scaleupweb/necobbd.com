import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, TOURNAMENT_STAFF } from "@/lib/auth";
import { ok, fail, handle, audit } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** The fixture plus both club squads, for entering the individual games. */
export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  await requireRole(TOURNAMENT_STAFF);
  const sheet = await db.getTieSheet(id);
  return sheet ? ok(sheet) : fail("Club match not found", 404);
});

/** body: { games: [{homePlayerId, awayPlayerId, homeGoals, awayGoals}], motmPlayerId?, decider?, notes? } */
export const POST = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(TOURNAMENT_STAFF);
  const body = await req.json();
  const fixture = await db.approveTieResult(id, body || {}, session.id);
  await audit(req, session, "TIE_RESULT_APPROVE", `Fixture ${id}`, `${fixture.result?.homeScore} - ${fixture.result?.awayScore}`);
  return ok(fixture);
});

/** body: { scheduledDate?, judge?, groupLink?, lineup?, homeCaptainId?, awayCaptainId?, newCode?, clearClaim? } — match setup. */
export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(TOURNAMENT_STAFF);
  const body = (await req.json()) || {};
  const pick = (k: string) => (typeof body[k] === "string" ? body[k] : undefined);
  const fixture = await db.updateCompetitionFixture(id, {
    scheduledDate: pick("scheduledDate"),
    judge: pick("judge"),
    groupLink: pick("groupLink"),
    homeCaptainId: pick("homeCaptainId"),
    awayCaptainId: pick("awayCaptainId"),
    lineup: body.lineup === null || (body.lineup && typeof body.lineup === "object") ? body.lineup : undefined,
    newCode: body.newCode === true,
    clearClaim: body.clearClaim === true,
  });
  await audit(req, session, "COMPETITION_FIXTURE_UPDATE", `Fixture ${id}`, Object.keys(body).join(", "));
  return ok(fixture);
});

/** Roll an approved result back so it can be entered again. */
export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(TOURNAMENT_STAFF);
  const fixture = await db.rollbackTieResult(id);
  await audit(req, session, "TIE_RESULT_ROLLBACK", `Fixture ${id}`);
  return ok(fixture);
});
