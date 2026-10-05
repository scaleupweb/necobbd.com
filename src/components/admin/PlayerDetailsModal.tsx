"use client";

import { useEffect, useState } from "react";
import { Loader2, KeyRound, Copy } from "lucide-react";
import { api, Button, inputCls, Modal, Notice } from "@/components/admin/ui";
import { toast, confirmDialog } from "@/lib/feedback";
import { formatCurrency } from "@/lib/utils";

const fmtDate = (v?: string, time = false) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return time ? d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : d.toLocaleDateString("en-GB", { dateStyle: "medium" });
};

/** Everything we hold on a player plus their login account, and a way to set a new password. */
export function PlayerDetailsModal({ player, onClose }: { player: any; onClose: () => void }) {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ password: string; login: string; email: string } | null>(null);

  useEffect(() => {
    api<any>(`/api/admin/players/${player.id}`).then(setD).catch((e) => setErr(e.message));
  }, [player.id]);

  const setPassword = async (generate: boolean) => {
    const yes = await confirmDialog({
      title: `Set a new password for ${player.fullName}?`,
      text: "Their old password stops working and they are signed out on every device.",
      confirmText: "Set password",
    });
    if (!yes) return;
    setBusy(true);
    try {
      const r = await api<any>(`/api/admin/players/${player.id}/password`, { method: "POST", json: generate ? {} : { password: pw } });
      setIssued(r);
      setPw("");
      toast.success("Password changed");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text).then(() => toast.success("Copied"));

  const a = d?.account;
  const frozen = d?.frozenUntil && new Date(d.frozenUntil) > new Date();
  const rows: [string, React.ReactNode][] = d
    ? [
        ["Full name", d.fullName],
        ["Username", `@${d.username}`],
        ["Email", a?.email],
        ["Phone", d.phone],
        ["Date of birth", fmtDate(d.dob)],
        [
          "Facebook",
          d.facebookProfile ? (
            <a href={d.facebookProfile} target="_blank" rel="noreferrer" className="text-sky-700 underline break-all">
              {d.facebookProfile}
            </a>
          ) : null,
        ],
        ["Konami UID", d.konamiId],
        ["Device", d.deviceModel],
        ["Position", d.preferredPosition],
        ["Location", d.location],
        ["Blood group", d.bloodGroup],
        ["Discord", d.discord],
        ["Club", d.club?.name || "No club"],
        ["Seat / shirt", [d.seat ? `Seat ${d.seat}` : "", d.shirtNo ? `#${d.shirtNo}` : ""].filter(Boolean).join(" · ")],
        ["Contract", d.contract?.startDate ? `${fmtDate(d.contract.startDate)} → ${fmtDate(d.contract.endDate)} (${d.contract.daysRemaining} days left)` : null],
        ["Frozen until", frozen ? fmtDate(d.frozenUntil, true) : null],
        ["Player status", d.status?.replace(/_/g, " ")],
        ["Verified", d.isVerified ? "Yes" : "No"],
        ["Rating / value", [d.rating, d.marketValue > 0 ? formatCurrency(d.marketValue) : ""].filter(Boolean).join(" · ")],
        ["Account role", a?.role?.replace(/_/g, " ")],
        ["Account status", a ? `${a.status}${a.locked ? " (locked after failed logins)" : ""}` : "No login account"],
        ["Joined", fmtDate(a?.createdAt || d.createdAt, true)],
        ["Last login", fmtDate(a?.lastLoginAt, true)],
      ]
    : [];

  const loginMessage = issued
    ? `Your NECOB login\nUsername: ${issued.login}\nEmail: ${issued.email}\nNew password: ${issued.password}\nPlease change it from your dashboard after you log in.`
    : "";

  return (
    <Modal open onClose={onClose} title={`${player.fullName} — details`} wide>
      {err ? (
        <Notice kind="err">{err}</Notice>
      ) : !d ? (
        <div className="py-10 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.avatar} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100" />
            <div className="min-w-0">
              <div className="font-black text-slate-950 truncate">{d.fullName}</div>
              <div className="text-xs text-slate-500 truncate">{a?.email || "No email on file"}</div>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 text-xs border-t border-slate-100">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2 border-b border-slate-100">
                <dt className="text-slate-500 shrink-0">{k}</dt>
                <dd className="font-semibold text-slate-900 text-right min-w-0 break-words">{v || "—"}</dd>
              </div>
            ))}
          </dl>

          {a && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <KeyRound className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-700">
                  <div className="font-black text-slate-950">Password</div>
                  Passwords are stored encrypted, so nobody — admins included — can see the old one. If the player forgot it, set a new one here and send it to them.
                </div>
              </div>
              {issued ? (
                <div className="rounded-xl bg-white border border-emerald-200 p-3 text-xs space-y-2">
                  <div className="font-bold text-emerald-700">New password set. Copy it now — it won&apos;t be shown again.</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-sm break-all">{issued.password}</code>
                    <Button small variant="secondary" onClick={() => copy(issued.password)}>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </Button>
                  </div>
                  <Button small variant="secondary" onClick={() => copy(loginMessage)}>
                    <Copy className="w-3.5 h-3.5" /> Copy login message
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    className={`${inputCls} flex-1`}
                    type="text"
                    autoComplete="off"
                    placeholder="New password (8+ chars, upper & lower case, a number)"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                  />
                  <Button small disabled={busy || !pw} onClick={() => setPassword(false)}>
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />} Set password
                  </Button>
                  <Button small variant="secondary" disabled={busy} onClick={() => setPassword(true)}>
                    Generate
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
