import { NextRequest } from "next/server";
import { ChangePasswordSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { requireAuth, hashPassword, verifyPassword, setSessionCookie } from "@/lib/auth";
import { ok, fail, handle, parseBody, limit } from "@/lib/api";

export const POST = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `change-pw:${session.id}`, 10, 60 * 60 * 1000);
  const { currentPassword, newPassword } = await parseBody(req, ChangePasswordSchema);

  const user = await db.getUserByEmailOrUsername(session.email, true);
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return fail("Current password is incorrect", 400, "INVALID_CREDENTIALS");
  }

  await db.setPassword(session.id, await hashPassword(newPassword));
  // tokenVersion was bumped, so re-issue this device's cookie; other devices are signed out.
  const fresh = await db.getUserById(session.id);
  if (fresh) await setSessionCookie(fresh);
  return ok({ message: "Password changed. Other devices have been signed out." });
});
