import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, MATCH_OFFICIALS, TOURNAMENT_STAFF } from "@/lib/auth";
import { FixtureUpdateSchema, LiveScoreSchema, MatchResultSchema } from "@/lib/validation";
import { onlySent } from "@/lib/admin-resources";
import { ok, fail, handle, audit } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const ActionSchema = z.object({
  action: z.enum(["START", "RESET", "POSTPONE", "CANCEL", "SCORE", "APPROVE", "REJECT_CLAIM", "UPDATE"]),
});

/** Match operations: start/stop live, live score, approve result, edit details. */
export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const raw = await req.json();
  const { action } = ActionSchema.parse(raw);

  if (action === "UPDATE") {
    const session = await requireRole(TOURNAMENT_STAFF);
    const data = onlySent(FixtureUpdateSchema.parse(raw), raw);
    const f = await db.updateFixture(id, data);
    await audit(req, session, "UPDATED_FIXTURE", id, Object.keys(data).join(", "));
    return ok(f);
  }

  const session = await requireRole(MATCH_OFFICIALS);
  let result: any;
  switch (action) {
    case "START":
      result = await db.setFixtureStatus(id, "LIVE");
      break;
    case "RESET":
      result = await db.setFixtureStatus(id, "SCHEDULED");
      break;
    case "POSTPONE":
      result = await db.setFixtureStatus(id, "POSTPONED");
      break;
    case "CANCEL":
      result = await db.setFixtureStatus(id, "CANCELLED");
      break;
    case "SCORE": {
      const s = LiveScoreSchema.parse(raw);
      result = await db.updateLiveScore(id, s.home, s.away);
      break;
    }
    case "APPROVE": {
      const data = MatchResultSchema.parse(raw);
      result = await db.approveMatchResult(id, data, session.id);
      break;
    }
    case "REJECT_CLAIM": {
      const f = await db.getFixtureById(id);
      if (!f?.result || f.result.status !== "PENDING") return fail("No pending result to reject", 409);
      result = await db.clearResultClaim(id);
      break;
    }
  }
  await audit(req, session, `FIXTURE_${action}`, id);
  return ok(result);
});

export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(TOURNAMENT_STAFF);
  await db.deleteFixture(id);
  await audit(req, session, "DELETED_FIXTURE", id);
  return ok({ deleted: true });
});
