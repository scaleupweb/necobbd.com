import crypto from "crypto";
import { NextRequest } from "next/server";
import { ForgotPasswordSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { ok, handle, parseBody, limit } from "@/lib/api";
import { sendMail, appUrl } from "@/lib/mail";

const RESET_MINUTES = 30;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function resetEmail(name: string, link: string, site: string) {
  const text = `Hi ${name},

We got a request to reset the password for your ${site} account.

Set a new password here (the link works once and expires in ${RESET_MINUTES} minutes):
${link}

If you didn't ask for this, ignore this email — your password stays the same.

— ${site}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0">
<tr><td style="background:#0b0c0f;padding:28px 32px;color:#ffffff">
<div style="font-size:11px;letter-spacing:3px;font-weight:800;color:#c79a3b;text-transform:uppercase">${esc(site)}</div>
<div style="font-size:22px;font-weight:900;margin-top:6px">Reset your password</div>
</td></tr>
<tr><td style="padding:28px 32px;font-size:15px;line-height:1.6">
<p style="margin:0 0 12px">Hi ${esc(name)},</p>
<p style="margin:0 0 20px">We got a request to reset the password for your ${esc(site)} account. Tap the button to choose a new one.</p>
<p style="margin:0 0 24px" align="center"><a href="${link}" style="display:inline-block;background:#c79a3b;color:#0b0c0f;text-decoration:none;font-weight:800;padding:14px 28px;border-radius:12px">Set a new password</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#64748b">This link works once and expires in ${RESET_MINUTES} minutes.</p>
<p style="margin:0;font-size:13px;color:#64748b">If you didn't ask for this, ignore this email — your password stays the same.</p>
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;word-break:break-all">Button not working? Paste this into your browser:<br>${link}</td></tr>
</table></td></tr></table></body></html>`;
  return { text, html };
}

export const POST = handle(async (req: NextRequest) => {
  limit(req, "forgot", 5, 60 * 60 * 1000);
  const { email } = await parseBody(req, ForgotPasswordSchema);

  const user = await db.getUserByEmailOrUsername(email);
  if (user && user.email === email && user.status === "ACTIVE") {
    // Only a hash of the token is stored; the link itself is single-use and short-lived.
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await db.setPasswordResetToken(user._id, tokenHash, new Date(Date.now() + RESET_MINUTES * 60 * 1000));
    const link = `${appUrl()}/reset-password?token=${token}`;
    const site = (await db.getSiteSettings()).brand.siteName.trim() || "NECOB";
    const { text, html } = resetEmail(user.fullName || user.username, link, site);
    try {
      await sendMail(user.email, `Reset your ${site} password`, text, html);
    } catch (err) {
      // Never reveal delivery problems to the requester; log for the admins.
      console.error("[forgot-password] email failed:", err);
    }
  }

  // Same response either way so emails can't be enumerated.
  return ok({ message: "If an account exists for that email, a reset link has been sent." });
});
