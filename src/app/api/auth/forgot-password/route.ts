import crypto from "crypto";
import { NextRequest } from "next/server";
import { ForgotPasswordSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { ok, handle, parseBody, limit } from "@/lib/api";
import { sendMail, appUrl } from "@/lib/mail";

export const POST = handle(async (req: NextRequest) => {
  limit(req, "forgot", 5, 60 * 60 * 1000);
  const { email } = await parseBody(req, ForgotPasswordSchema);

  const user = await db.getUserByEmailOrUsername(email);
  if (user && user.email === email && user.status === "ACTIVE") {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await db.setPasswordResetToken(user._id, tokenHash, new Date(Date.now() + 60 * 60 * 1000));
    const link = `${appUrl()}/reset-password?token=${token}`;
    await sendMail(
      user.email,
      "Reset your password",
      `Hi ${user.fullName},\n\nUse this link to set a new password (valid for 1 hour):\n${link}\n\nIf you didn't request this, you can ignore this email.`
    );
  }

  // Same response either way so emails can't be enumerated.
  return ok({ message: "If an account exists for that email, a reset link has been sent." });
});
