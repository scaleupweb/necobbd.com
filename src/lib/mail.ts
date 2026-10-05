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

export function appUrl() {
  // Netlify sets URL to the site's main address; used when NEXT_PUBLIC_APP_URL is missing.
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "http://localhost:3000").replace(/\/$/, "");
}
