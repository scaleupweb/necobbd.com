"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { api, Button } from "@/components/admin/ui";
import { infoDialog } from "@/lib/feedback";

const esc = (v: string) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Sends a test email to the signed-in admin and shows exactly what the mail server said. */
export function MailTestButton() {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const r = await api<any>("/api/admin/mail-test", { method: "POST" });
      const c = r.config || {};
      const lines = [
        ["Sent to", r.to],
        ["SMTP host", `${c.host || "—"}:${c.port || "—"}`],
        ["SMTP user", c.user || "—"],
        ["From", c.from || "—"],
        ["Site URL in links", c.appUrl],
      ]
        .map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:3px 0"><span>${k}</span><b>${esc(v)}</b></div>`)
        .join("");
      const error = r.error ? `<div style="margin-top:10px;padding:10px;border-radius:10px;background:#fff1f2;color:#9f1239;text-align:left;word-break:break-word">${esc(r.error)}</div>` : "";
      await infoDialog({
        icon: r.sent ? "success" : "error",
        title: r.sent ? "Test email sent — check the inbox (and Spam)" : "Email could not be sent",
        html: `<div style="font-size:12px;text-align:left">${lines}${error}</div>`,
      });
    } catch (e: any) {
      await infoDialog({ icon: "error", title: "Test failed", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="secondary" onClick={run} disabled={busy}>
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Send test email
    </Button>
  );
}
