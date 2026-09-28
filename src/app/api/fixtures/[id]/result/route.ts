import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, MATCH_OFFICIALS } from "@/lib/auth";
import { MatchResultSchema } from "@/lib/validation";
import { ok, fail, handle, parseBody, audit, limit } from "@/lib/api";

/**
 * Match officials approve results directly. A player (or club manager) who took
 * part in the match can only submit a claim, which stays PENDING until approved.
 */
export const POST = handle(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireAuth();
  limit(req, `result:${session.id}`, 20, 60 * 60 * 1000);
  const data = await parseBody(req, MatchResultSchema);

  const fixture = await db.getFixtureById(id);
  if (!fixture) return fail("Fixture not found", 404, "NOT_FOUND");

  if ((MATCH_OFFICIALS as string[]).includes(session.role)) {
    const updated = await db.approveMatchResult(id, data, session.id);
    await audit(req, session, "APPROVED_MATCH_RESULT", `Fixture ${id}`, `${data.homeScore} - ${data.awayScore}`);
    return ok(updated);
  }

  const isParticipant =
    (session.playerProfileId && (fixture.homePlayer?.id === session.playerProfileId || fixture.awayPlayer?.id === session.playerProfileId)) ||
    (session.role === "CLUB_MANAGER" && session.clubId && (fixture.homeClub?.id === session.clubId || fixture.awayClub?.id === session.clubId));
  if (!isParticipant) return fail("Only match participants or officials can report a result", 403, "FORBIDDEN");
  if (fixture.status !== "LIVE" && fixture.status !== "SCHEDULED") return fail("This match can no longer accept results", 409);

  const updated = await db.submitResultClaim(id, data, session.id);
  return ok(updated);
});
