import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, ADMIN_ONLY } from "@/lib/auth";
import { ok, fail, handle, parseBody, audit, limit } from "@/lib/api";
import { bulkTransport, brandedEmail, mailConfigured, mailFrom } from "@/lib/mail";
import { sanitizeRichText, isRichTextEmpty } from "@/lib/rich-text";

export const dynamic = "force-dynamic";
// A batch of up to 10 clubs can take a while over SMTP.
export const maxDuration = 60;

/** Clubs with the addresses a message would go to. */
export const GET = handle(async () => {
  await requireRole(ADMIN_ONLY);
  return ok({ clubs: await db.getClubMailingList(), configured: mailConfigured() });
});

const Body = z.object({
  subject: z.string().trim().min(3, "Write a subject").max(150),
  html: z.string().max(300000),
  clubIds: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).max(10).default([]),
  includeManager: z.boolean().default(true),
  /** Send only to the signed-in admin, to preview the email. */
  test: z.boolean().default(false),
});

/**
 * Emails a batch of clubs (the page sends 10 at a time and shows progress).
 * Each club gets its own email — nobody sees another club's address.
 */
export const POST = handle(async (req: NextRequest) => {
  const session = await requireRole(ADMIN_ONLY);
  limit(req, `club-mail:${session.id}`, 120, 60 * 60 * 1000);
  const data = await parseBody(req, Body);
  if (isRichTextEmpty(data.html)) return fail("Write the message first");
  if (!mailConfigured()) return fail("Email is not set up on this site (SMTP settings are missing)", 503, "MAIL_OFF");

  const html = sanitizeRichText(data.html);
  const settings = await db.getSiteSettings();
  const siteName = settings.brand.siteName.trim() || "NECOB";
  const t = bulkTransport()!;
  const send = (to: string[], greeting: string) => {
    const mail = brandedEmail({ subject: data.subject, html, greeting, siteName });
    return t.sendMail({ from: mailFrom(), replyTo: process.env.SMTP_USER, to, subject: data.subject, html: mail.html, text: mail.text });
  };

  try {
    if (data.test) {
      await send([session.email], "Hello Club Name team,");
      return ok({ test: true, to: session.email });
    }
    if (!data.clubIds.length) return fail("Choose at least one club");

    const all = await db.getClubMailingList();
    const byId = new Map(all.map((c) => [c.id, c]));
    const results: { clubId: string; name: string; to: string[]; ok: boolean; error?: string }[] = [];
    for (const id of data.clubIds) {
      const c = byId.get(id);
      if (!c) {
        results.push({ clubId: id, name: "Unknown club", to: [], ok: false, error: "Club not found" });
        continue;
      }
      const to = [...new Set([c.clubEmail, data.includeManager ? c.managerEmail : ""].filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))];
      if (!to.length) {
        results.push({ clubId: id, name: c.name, to, ok: false, error: "No email address" });
        continue;
      }
      try {
        await send(to, `Hello ${c.name} team,`);
        results.push({ clubId: id, name: c.name, to, ok: true });
      } catch (e: any) {
        results.push({ clubId: id, name: c.name, to, ok: false, error: String(e?.response || e?.message || e).slice(0, 160) });
      }
    }
    const sent = results.filter((r) => r.ok).length;
    await audit(req, session, "CLUB_EMAIL_SENT", data.subject.slice(0, 80), `${sent}/${results.length} clubs: ${results.map((r) => r.name).join(", ").slice(0, 400)}`);
    return ok({ results });
  } finally {
    t.close();
  }
});
