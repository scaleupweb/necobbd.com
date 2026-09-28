import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { PlayerSelfUpdateSchema } from "@/lib/validation";
import { ok, fail, handle, parseBody, limit } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const session = await requireAuth();
  const player = await db.getPlayerByUserId(session.id);
  return ok({ user: session, player });
});

/** A player edits only their own safe profile fields (never rating, status, club...). */
export const PATCH = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `profile:${session.id}`, 30, 60 * 60 * 1000);
  const data = await parseBody(req, PlayerSelfUpdateSchema);

  const player = await db.getPlayerByUserId(session.id);
  if (!player) {
    if (data.fullName || data.avatar) {
      await db.updateUser(session.id, { ...(data.fullName ? { fullName: data.fullName } : {}), ...(data.avatar ? { avatar: data.avatar } : {}) });
      return ok({ updated: true });
    }
    return fail("No player profile linked to this account", 404, "NOT_FOUND");
  }
  const updated = await db.updatePlayer(player.id, data);
  return ok(updated);
});
