import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, fail, handle, parseBody, audit, limit } from "@/lib/api";

const Schema = z.object({ playerId: z.string().regex(/^[a-f0-9]{24}$/i, "Pick a player") });

/** Main manager hands the club over to a squad player's own account. */
export const POST = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `club-handover:${session.id}`, 10, 60 * 60 * 1000);
  const { playerId } = await parseBody(req, Schema);
  const club = await db.getMainManagedClub(session.id);
  if (!club) return fail("Only the club's main manager can hand the club over", 403, "FORBIDDEN");
  const result = await db.handOverClub(String(club._id), session.id, playerId);
  await audit(req, session, "CLUB_HANDED_OVER", `Club ${club.name}`, `New main manager: ${result.managerName}`);
  return ok(result);
});
