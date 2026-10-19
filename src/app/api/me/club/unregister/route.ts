import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, fail, handle, parseBody, audit, limit } from "@/lib/api";

const Schema = z.object({
  playerId: z.string().regex(/^[a-f0-9]{24}$/i, "Pick a player"),
  confirmText: z.string().max(100),
});

/** Club manager unregisters a squad player. The site name must be typed exactly to confirm. */
export const POST = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `club-unregister:${session.id}`, 30, 60 * 60 * 1000);
  const { playerId, confirmText } = await parseBody(req, Schema);
  const clubId = await db.getEditableClubId(session.id);
  if (!clubId || !(await db.canUseClubTool(session.id, clubId, "unregister-player"))) return fail("You don't have access to unregister players", 403, "FORBIDDEN");
  const settings = await db.getSiteSettings();
  const siteName = settings.brand.siteName.trim();
  if (confirmText.trim() !== siteName) return fail(`Type “${siteName}” exactly to confirm`, 400, "CONFIRMATION_REQUIRED");
  const result = await db.clubReleasePlayer(clubId, playerId, session.fullName);
  await audit(req, session, "CLUB_UNREGISTERED_PLAYER", `Club ${clubId}`, result.player);
  return ok(result);
});
