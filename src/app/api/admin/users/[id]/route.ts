import crypto from "crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, hashPassword, ADMIN_ONLY } from "@/lib/auth";
import { UserAdminUpdateSchema } from "@/lib/validation";
import { onlySent } from "@/lib/admin-resources";
import { ok, fail, handle, audit } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const PRIVILEGED = ["SUPER_ADMIN", "ADMIN"];

async function guard(sessionRole: string, sessionId: string, targetId: string) {
  const target = await db.getUserById(targetId);
  if (!target) return { error: fail("User not found", 404, "NOT_FOUND") };
  if (targetId === sessionId) return { target, self: true };
  if (PRIVILEGED.includes(target.role) && sessionRole !== "SUPER_ADMIN") {
    return { error: fail("Only a super admin can modify admin accounts", 403, "FORBIDDEN") };
  }
  return { target, self: false };
}

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(ADMIN_ONLY);
  const raw = await req.json();

  const g = await guard(session.role, session.id, id);
  if (g.error) return g.error;

  // Admin-triggered password reset: returns a one-time temporary password.
  if (raw.action === "RESET_PASSWORD") {
    const temp = `Tmp-${crypto.randomBytes(6).toString("base64url")}9a`;
    await db.setPassword(id, await hashPassword(temp));
    await audit(req, session, "RESET_USER_PASSWORD", g.target.username);
    return ok({ temporaryPassword: temp });
  }

  const data = onlySent(UserAdminUpdateSchema.parse(raw), raw);
  if (g.self && (data.role || data.status)) return fail("You can't change your own role or status", 400);
  if (data.role && PRIVILEGED.includes(data.role) && session.role !== "SUPER_ADMIN") {
    return fail("Only a super admin can grant admin roles", 403, "FORBIDDEN");
  }
  if (data.email) {
    const other = await db.getUserByEmailOrUsername(data.email);
    if (other && String(other._id) !== id) return fail("Email already in use", 409, "CONFLICT");
  }
  const updated = await db.updateUser(id, data);
  await audit(req, session, "UPDATED_USER", g.target.username, JSON.stringify(data));
  return ok(updated);
});

export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(ADMIN_ONLY);
  const g = await guard(session.role, session.id, id);
  if (g.error) return g.error;
  if (g.self) return fail("You can't delete your own account here", 400);
  await db.deleteUser(id);
  await audit(req, session, "DELETED_USER", g.target.username);
  return ok({ deleted: true });
});
