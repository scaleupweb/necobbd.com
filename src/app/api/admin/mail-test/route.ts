import { NextRequest } from "next/server";
import { requireRole, ADMIN_ONLY } from "@/lib/auth";
import { ok, handle, audit, limit } from "@/lib/api";
import { sendMail, mailConfigured, appUrl } from "@/lib/mail";

export const dynamic = "force-dynamic";

/** Sends a test email to the signed-in admin and reports the exact SMTP result, so delivery problems can be diagnosed on the live site. */
export const POST = handle(async (req: NextRequest) => {
  const session = await requireRole(ADMIN_ONLY);
  limit(req, `mail-test:${session.id}`, 10, 60 * 60 * 1000);
  const to = session.email;
  const config = {
    configured: mailConfigured(),
    host: process.env.SMTP_HOST || "",
    port: process.env.SMTP_PORT || "",
    user: process.env.SMTP_USER || "",
    from: process.env.EMAIL_FROM || "",
    appUrl: appUrl(),
  };
  if (!config.configured) return ok({ sent: false, to, config, error: "SMTP_HOST, SMTP_USER or SMTP_PASSWORD is missing on this deployment." });
  try {
    await sendMail(to, "NECOB email test", `This is a test email from ${config.appUrl}. If you can read it, password reset emails work.`);
    await audit(req, session, "MAIL_TEST", to, "sent");
    return ok({ sent: true, to, config });
  } catch (e: any) {
    return ok({ sent: false, to, config, error: [e?.code, e?.responseCode, e?.response || e?.message].filter(Boolean).join(" · ") });
  }
});
