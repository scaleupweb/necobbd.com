import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, handle, audit, limit } from "@/lib/api";

/** The signed-in player leaves their club and becomes a free agent. */
export const POST = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `leave-club:${session.id}`, 10, 60 * 60 * 1000);
  const result = await db.leaveClub(session.id);
  await audit(req, session, "PLAYER_LEFT_CLUB", `Club ${result.left}`, "");
  return ok(result);
});
