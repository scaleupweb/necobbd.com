"use client";

import { useCallback, useEffect, useState } from "react";
import { Gavel, Undo2, Loader2 } from "lucide-react";
import { api, Badge, Button, Empty, Field, inputCls, Modal, Notice, PageHeader, statusTone } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

const PENALTIES = [
  ["WARNING", "Official warning"],
  ["SUSPENSION_1W", "1-week suspension"],
  ["SUSPENSION_1M", "1-month suspension"],
  ["BAN_SEASON", "Season ban (180 days)"],
  ["PERMANENT_BAN", "Permanent ban"],
];

export default function AdminDisciplinaryPage() {
  const [records, setRecords] = useState<any[] | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ targetType: "PLAYER", targetId: "", penalty: "WARNING", reason: "", evidence: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRecords(await api("/api/admin/disciplinary"));
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/players?status=ALL", { cache: "no-store" }).then((r) => r.json()).then((j) => setPlayers(j.data || []));
    api<any[]>("/api/clubs").then(setClubs).catch(() => {});
  }, [load]);

  const issue = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/disciplinary", { method: "POST", json: f });
      setOpen(false);
      setF({ targetType: "PLAYER", targetId: "", penalty: "WARNING", reason: "", evidence: "", notes: "" });
      setMsg({ ok: true, text: "Sanction issued. The player has been notified." });
      load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (r: any) => {
    if (!confirm(`Revoke the sanction against ${r.targetName}?`)) return;
    try {
      await api(`/api/admin/disciplinary/${r.id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  };

  const targets = f.targetType === "PLAYER" ? players.map((p) => ({ id: p.id, label: `${p.fullName} (@${p.username})` })) : clubs.map((c) => ({ id: c.id, label: c.name }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Disciplinary"
        subtitle="Suspensions and bans automatically change the player's status and are listed on the public register."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Gavel className="w-4 h-4" /> Issue sanction
          </Button>
        }
      />
      {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}

      {records === null ? (
        <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>
      ) : records.length === 0 ? (
        <Empty>No sanctions on record.</Empty>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Penalty</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 px-3 font-bold">
                    {r.targetName}
                    <div className="text-[10px] text-slate-500 font-normal">{r.targetType}</div>
                  </td>
                  <td className="py-2.5 px-3">{r.penalty.replace(/_/g, " ")}</td>
                  <td className="py-2.5 px-3 max-w-xs">{r.reason}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {formatDate(r.startDate)} → {r.endDate ? formatDate(r.endDate) : "permanent"}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {r.status === "ACTIVE" && (
                      <Button small variant="secondary" onClick={() => revoke(r)}>
                        <Undo2 className="w-3.5 h-3.5" /> Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Issue sanction">
        <form onSubmit={issue} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Against">
              <select className={inputCls} value={f.targetType} onChange={(e) => setF({ ...f, targetType: e.target.value, targetId: "" })}>
                <option value="PLAYER">Player</option>
                <option value="CLUB">Club</option>
              </select>
            </Field>
            <Field label="Penalty">
              <select className={inputCls} value={f.penalty} onChange={(e) => setF({ ...f, penalty: e.target.value })}>
                {PENALTIES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={f.targetType === "PLAYER" ? "Player *" : "Club *"}>
            <select className={inputCls} value={f.targetId} onChange={(e) => setF({ ...f, targetId: e.target.value })} required>
              <option value="">Select…</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reason * (public)">
            <textarea className={inputCls} rows={2} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} required minLength={5} />
          </Field>
          <Field label="Evidence link / notes (internal)">
            <textarea className={inputCls} rows={2} value={f.evidence} onChange={(e) => setF({ ...f, evidence: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={busy}>
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Issue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
