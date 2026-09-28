import crypto from "crypto";
import { NextRequest } from "next/server";
import { ResetPasswordSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { hashPassword, clearSessionCookie } from "@/lib/auth";
import { ok, fail, handle, parseBody, limit } from "@/lib/api";

export const POST = handle(async (req: NextRequest) => {
  limit(req, "reset", 10, 60 * 60 * 1000);
  const { token, password } = await parseBody(req, ResetPasswordSchema);
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await db.getUserByResetToken(tokenHash);
  if (!user) return fail("This reset link is invalid or has expired", 400, "INVALID_TOKEN");

  await db.setPassword(String(user._id), await hashPassword(password));
  await clearSessionCookie();
  await db.notify(String(user._id), "Password changed", "Your password was reset. If this wasn't you, contact support immediately.");
  return ok({ message: "Password updated. You can now sign in." });
});
