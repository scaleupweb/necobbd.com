import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ClubPlayerUpdateSchema } from "@/lib/validation";
import { ok, fail, handle, parseBody, audit, limit } from "@/lib/api";

/** Club manager (or full-control moderator) updates a player in their own squad. */
export const PATCH = handle(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireAuth();
  limit(req, `club-player-edit:${session.id}`, 120, 60 * 60 * 1000);
  const data = await parseBody(req, ClubPlayerUpdateSchema);

  const player = await db.getPlayerById(id);
  if (!player || !player.clubId) return fail("Player not found in a club", 404, "NOT_FOUND");
  if (!(await db.canUseClubTool(session.id, player.clubId, "update-player"))) return fail("You don't have access to update squad players", 403, "FORBIDDEN");

  const updates: Record<string, any> = {};
  if (data.avatar !== undefined) updates.avatar = data.avatar;
  if (data.konamiId !== undefined) updates.konamiId = data.konamiId;
  if (data.deviceModel !== undefined) updates.deviceModel = data.deviceModel;
  if (data.shirtNo !== undefined) {
    const no = data.shirtNo === "" || data.shirtNo === null ? null : data.shirtNo;
    if (no !== null) {
      const club = await db.getClubById(player.clubId);
      const taken = club?.squad.find((p: any) => p.id !== player.id && p.shirtNo === no);
      if (taken) return fail(`#${no} is already worn by ${taken.fullName}`, 409, "CONFLICT");
    }
    updates.shirtNo = no;
  }

  const updated = await db.updatePlayer(player.id, updates);
  await audit(req, session, "CLUB_UPDATED_PLAYER", `Player ${player.fullName}`, Object.keys(updates).join(", "));
  return ok(updated);
});
