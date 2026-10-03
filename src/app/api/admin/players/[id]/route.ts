import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PlayerAdminUpdateSchema } from "@/lib/validation";
import { onlySent } from "@/lib/admin-resources";
import { ok, handle, audit } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(["ADMIN", "MODERATOR"]);
  const raw = await req.json();
  const data = onlySent(PlayerAdminUpdateSchema.parse(raw), raw);
  // Moderators may verify/suspend but not change ratings, values or clubs.
  if (session.role === "MODERATOR") {
    for (const k of ["rating", "marketValue", "clubId"]) delete data[k];
  }
  // Club changes go through the same rules as a signing: seat, 120-day contract, history.
  if ("clubId" in data) {
    await db.adminMovePlayer(id, data.clubId || "", session.fullName);
    delete data.clubId;
  }
  const updated = Object.keys(data).length ? await db.updatePlayer(id, data) : await db.getPlayerById(id);
  if ("status" in data && updated?.userId) {
    const userStatus = data.status === "PENDING_VERIFICATION" ? "PENDING" : data.status;
    await db.updateUser(String(updated.userId), { status: userStatus });
  }
  await audit(req, session, "UPDATED_PLAYER", updated?.username || id, JSON.stringify(data));
  return ok(updated);
});
