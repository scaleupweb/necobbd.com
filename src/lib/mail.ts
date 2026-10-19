import "server-only";
import nodemailer from "nodemailer";

function transport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

export function mailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

export async function sendMail(to: string, subject: string, text: string, html?: string) {
  const t = transport();
  if (!t) {
    // No SMTP configured: log so the admin can still complete the flow in development.
    console.error(`[mail] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD). Email to ${to} — "${subject}" was NOT sent.`);
    return false;
  }
  await t.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, replyTo: process.env.SMTP_USER, to, subject, text, html });
  return true;
}

/** One pooled SMTP connection for sending many emails in a row (e.g. a message to every club). */
export function bulkTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({ pool: true, maxConnections: 2, host, port, secure: port === 465, auth: { user, pass } });
}

export const mailFrom = () => process.env.EMAIL_FROM || process.env.SMTP_USER || "";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Wraps admin-written HTML in a simple branded email layout. Relative links and
 * image paths are made absolute so they work inside email apps.
 */
export function brandedEmail(opts: { subject: string; html: string; greeting?: string; siteName?: string }) {
  const base = appUrl();
  const body = opts.html
    .replace(/\s(src|href)="\/(?!\/)/g, ` $1="${base}/`)
    // Email apps ignore page CSS, so images need inline sizing to stay inside the email.
    .replace(/<img\b/g, '<img style="display:block;max-width:100%;height:auto;border-radius:12px;margin:12px auto"')
    .replace(/<a\b(?![^>]*style=)/g, '<a style="color:#2563eb;font-weight:bold"');
  const site = esc(opts.siteName || "NECOB");
  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#334155">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
<tr><td style="background:#0B0C0F;padding:20px 24px;color:#F7DC8B;font-weight:900;font-size:18px;letter-spacing:.5px">${site}</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.65">
${opts.greeting ? `<p style="margin:0 0 14px">${esc(opts.greeting)}</p>` : ""}
${body}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8">Sent by the ${site} admin team · <a href="${base}" style="color:#C79A3B">${esc(base.replace(/^https?:\/\//, ""))}</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = `${opts.greeting ? opts.greeting + "\n\n" : ""}${body.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|h[1-4]|li|blockquote)>/gi, "\n\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\n{3,}/g, "\n\n").trim()}\n\n— ${opts.siteName || "NECOB"} admin team\n${base}`;
  return { html, text };
}

export function appUrl() {
  // Netlify sets URL to the site's main address; used when NEXT_PUBLIC_APP_URL is missing.
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "http://localhost:3000").replace(/\/$/, "");
}
