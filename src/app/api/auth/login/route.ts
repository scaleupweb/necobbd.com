import { NextRequest } from "next/server";
import { LoginSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword, setSessionCookie } from "@/lib/auth";
import { ok, fail, handle, parseBody, limit } from "@/lib/api";

// Used to keep response time similar whether or not the account exists.
let dummyHash: string | null = null;
async function dummyCompare(password: string) {
  dummyHash ??= await hashPassword("not-a-real-password");
  await verifyPassword(password, dummyHash);
}

export const POST = handle(async (req: NextRequest) => {
  limit(req, "login", 10, 15 * 60 * 1000);
  const { emailOrUsername, password } = await parseBody(req, LoginSchema);

  const user = await db.getUserByEmailOrUsername(emailOrUsername, true);
  if (!user) {
    await dummyCompare(password);
    return fail("Invalid email/username or password", 401, "INVALID_CREDENTIALS");
  }

  if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
    const mins = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 60000);
    return fail(`Too many failed attempts. Account locked for ${mins} more minute(s).`, 429, "LOCKED");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await db.recordLoginFailure(user._id);
    return fail("Invalid email/username or password", 401, "INVALID_CREDENTIALS");
  }

  if (user.status !== "ACTIVE") {
    return fail(`Your account is ${user.status.toLowerCase()}. Contact support.`, 403, "ACCOUNT_INACTIVE");
  }

  await db.recordLoginSuccess(user._id);
  await setSessionCookie(user);

  const player = await db.getPlayerByUserId(String(user._id));
  return ok({
    id: String(user._id),
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    avatar: player?.avatar || user.avatar,
    playerProfileId: player?.id,
    clubId: user.clubId ? String(user.clubId) : player?.clubId,
  });
});
