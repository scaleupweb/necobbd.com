import crypto from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, hashPassword, ADMIN_ONLY } from "@/lib/auth";
import { password } from "@/lib/validation";
import { ok, fail, handle, audit, limit, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({ password: password.optional() });

/**
 * Set a new password for a player's account (passwords are hashed, so they can't be shown).
 * Send `password` to choose it, or leave it out to generate one. The new password is returned once.
 */
export const POST = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(ADMIN_ONLY);
  limit(req, `admin-set-password:${session.id}`, 30, 60 * 60 * 1000);
  const body = await parseBody(req, Body);

  const player = await db.getPlayerById(id);
  if (!player) return fail("Player not found", 404, "NOT_FOUND");
  const user = player.userId ? await db.getUserById(String(player.userId)) : null;
  if (!user) return fail("This player has no login account", 400);
  if (String(user._id) === session.id) return fail("Change your own password from your dashboard", 400);
  if (["SUPER_ADMIN", "ADMIN"].includes(user.role) && session.role !== "SUPER_ADMIN") {
    return fail("Only a super admin can change an admin's password", 403, "FORBIDDEN");
  }

  const next = body.password || `Necob-${crypto.randomBytes(4).toString("hex")}A1`;
  await db.setPassword(String(user._id), await hashPassword(next));
  await audit(req, session, "SET_PLAYER_PASSWORD", user.username, body.password ? "custom" : "generated");
  return ok({ password: next, login: user.username, email: user.email });
});
