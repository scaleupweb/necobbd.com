"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, X, Loader2, ExternalLink } from "lucide-react";
import { toast, confirmDialog, infoDialog } from "@/lib/feedback";
import { CONTRACT_DAYS, FREEZE_DAYS } from "@/lib/squad";
import { api, Badge, Button, Empty, Notice, PageHeader, inputCls, statusTone } from "@/components/admin/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { noClubLabel } from "@/lib/squad";

export default function AdminTransfersPage() {
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [buyer, setBuyer] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const load = useCallback(async () => {
    try {
      setData(await api("/api/admin/transfers"));
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<any>, ok: string) => {
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: ok });
      load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  };

  if (!data) return msg ? <Notice kind="err">{msg.text}</Notice> : <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>;

  const pending = data.requests.filter((r: any) => r.status === "PENDING" && r.type !== "SIGNING");
  const signings = data.requests.filter((r: any) => r.status === "PENDING" && r.type === "SIGNING");
  const bulk = async (list: any[], status: "ACCEPTED" | "REJECTED") => {
    const ids = list.filter((r) => selected.has(r.id)).map((r) => r.id);
    if (!ids.length) return;
    const yes = await confirmDialog({
      title: `${status === "ACCEPTED" ? "Approve" : "Reject"} ${ids.length} request${ids.length === 1 ? "" : "s"}?`,
      text:
        status === "ACCEPTED"
          ? `They are processed oldest first. Signed players get a ${CONTRACT_DAYS}-day contract and a ${FREEZE_DAYS}-day freeze. Any that can't go through (full squad, player already signed…) are skipped and listed.`
          : "Each club will be notified.",
      confirmText: status === "ACCEPTED" ? `Approve ${ids.length}` : `Reject ${ids.length}`,
      danger: status === "REJECTED",
    });
    if (!yes) return;
    setBulkBusy(true);
    try {
      const res: any = await api("/api/admin/transfers/requests/bulk", { method: "POST", json: { ids, status } });
      const word = status === "ACCEPTED" ? "approved" : "rejected";
      if (res.failed) {
        const byId = new Map(list.map((r) => [r.id, r]));
        const rows = res.results
          .filter((x: any) => !x.ok)
          .map((x: any) => {
            const r: any = byId.get(x.id);
            return `<li style="margin:4px 0"><b>${escapeHtml(r?.player?.fullName || "Request")}</b> → ${escapeHtml(r?.club?.name || "")}: ${escapeHtml(x.error)}</li>`;
          })
          .join("");
        await infoDialog({ icon: "warning", title: `${res.done} ${word}, ${res.failed} skipped`, html: `<ul style="text-align:left;font-size:13px;padding-left:18px">${rows}</ul>` });
      } else toast.success(`${res.done} request${res.done === 1 ? "" : "s"} ${word}`);
      setSelected(new Set());
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const decide = async (r: any, status: "ACCEPTED" | "REJECTED") => {
    const yes = await confirmDialog({
      title: status === "ACCEPTED" ? `Approve ${r.player?.fullName} → ${r.club?.name}?` : `Reject this transfer request?`,
      text: status === "ACCEPTED" ? `The player joins seat ${r.seat} on a ${CONTRACT_DAYS}-day contract and is frozen for ${FREEZE_DAYS} days.` : "The club will be notified.",
      confirmText: status === "ACCEPTED" ? "Approve" : "Reject",
      danger: status === "REJECTED",
    });
    if (!yes) return;
    try {
      await api(`/api/admin/transfers/requests/${r.id}`, { method: "PATCH", json: { status } });
      toast.success(status === "ACCEPTED" ? `${r.player?.fullName} joined ${r.club?.name}` : "Request rejected");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Transfers" subtitle="Approve club offers, complete listed transfers and review the transfer history. List players from the Players page." />
      {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}

      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-950">Transfer Window requests ({signings.length})</h2>
        {signings.length > 0 && <BulkBar list={signings} selected={selected} setSelected={setSelected} busy={bulkBusy} onAct={(st) => bulk(signings, st)} />}
        {signings.length === 0 ? (
          <Empty>No signing requests waiting.</Empty>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {signings.map((r: any) => (
              <div key={r.id} className={`p-4 rounded-2xl bg-white border space-y-3 text-xs transition-colors ${selected.has(r.id) ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-200"}`}>
                {/* Phones: player on one line, club under it. Wider screens: player → club side by side. */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-3 min-w-0 sm:flex-1">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.player?.fullName}`} className="w-4 h-4 accent-emerald-600 shrink-0 cursor-pointer" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.player?.avatar} alt="" className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover bg-slate-100 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-slate-950 text-sm break-words leading-snug">{r.player?.fullName}</div>
                      <div className="text-slate-500 font-mono break-all">{r.player?.konamiId || `@${r.player?.username}`}</div>
                      {r.player?.clubId && <div className="text-rose-600 font-bold">Already in a club now</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 pl-7 sm:pl-0 sm:max-w-[50%]">
                    <span className="text-slate-400 font-black shrink-0">→</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.club?.logo} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-950 break-words leading-snug">{r.club?.name}</div>
                      <div className="text-slate-500">Main Team Squad · Seat {r.seat}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-slate-500">{formatDate(r.createdAt)}</span>
                    {r.postLink && (
                      <a href={r.postLink} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100">
                        <ExternalLink className="w-3.5 h-3.5" /> Facebook post
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1.5 w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
                    <Button small variant="success" onClick={() => decide(r, "ACCEPTED")}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button small variant="secondary" onClick={() => decide(r, "REJECTED")}>
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-950">Club offers awaiting approval ({pending.length})</h2>
        {pending.length > 0 && <BulkBar list={pending} selected={selected} setSelected={setSelected} busy={bulkBusy} onAct={(st) => bulk(pending, st)} />}
        {pending.length === 0 ? (
          <Empty>No pending offers.</Empty>
        ) : (
          <div className="space-y-2">
            {pending.map((r: any) => (
              <div key={r.id} className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border text-xs transition-colors ${selected.has(r.id) ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-200"}`}>
                <div className="flex items-start gap-3 min-w-0 flex-1 basis-60">
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select offer for ${r.player?.fullName}`} className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0 cursor-pointer" />
                <div className="min-w-0">
                  <div className="font-bold text-slate-950 break-words">
                    {r.club?.name} → {r.player?.fullName}
                  </div>
                  <div className="text-slate-500">
                    Offer {formatCurrency(r.offeredFee)}
                    {r.proposedSalary ? ` · salary ${formatCurrency(r.proposedSalary)}` : ""} · {formatDate(r.createdAt)}
                  </div>
                  {r.message && <div className="text-slate-600 italic mt-1">“{r.message}”</div>}
                </div>
                </div>
                <div className="flex gap-1.5 w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
                  <Button small variant="success" onClick={() => run(() => api(`/api/admin/transfers/requests/${r.id}`, { method: "PATCH", json: { status: "ACCEPTED" } }), "Transfer completed.")}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept & transfer
                  </Button>
                  <Button small variant="secondary" onClick={() => run(() => api(`/api/admin/transfers/requests/${r.id}`, { method: "PATCH", json: { status: "REJECTED" } }), "Offer rejected.")}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-950">Transfer list ({data.listings.length})</h2>
        {data.listings.length === 0 ? (
          <Empty>No players listed. Use the tag button on the Players page to list someone.</Empty>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {data.listings.map((l: any) => (
              <div key={l.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.player.avatar} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-950 break-words">{l.player.fullName}</div>
                    <div className="text-slate-500">{l.player.club?.name || noClubLabel(l.player)} · asking {formatCurrency(l.askingPrice)}</div>
                  </div>
                  <Button small variant="ghost" onClick={() => run(() => api("/api/admin/transfers", { method: "POST", json: { action: "CLOSE", listingId: l.id } }), "Listing removed.")} title="Remove listing">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select className={inputCls} value={buyer[l.id] || ""} onChange={(e) => setBuyer({ ...buyer, [l.id]: e.target.value })}>
                    <option value="">Buying club…</option>
                    {data.clubs
                      .filter((c: any) => c.id !== l.player.club?.id)
                      .map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <Button
                    small
                    variant="success"
                    disabled={!buyer[l.id]}
                    onClick={() => run(() => api("/api/admin/transfers", { method: "POST", json: { action: "APPROVE", listingId: l.id, buyerClubId: buyer[l.id] } }), "Transfer completed.")}
                  >
                    Complete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-950">History</h2>
        {data.history.length === 0 ? (
          <Empty>No transfers yet.</Empty>
        ) : (
          <>
          <div className="sm:hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {data.history.map((h: any) => (
              <div key={h.id} className="p-3 text-xs space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-950 break-words">{h.playerName}</span>
                  <span className="font-mono text-slate-600 shrink-0">{formatCurrency(h.fee || 0)}</span>
                </div>
                <div className="text-slate-600 break-words">
                  {h.previousClubName} → <strong className="text-slate-900">{h.newClubName}</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  {formatDate(h.transferDate)}
                  {h.approvedBy ? ` · ${h.approvedBy}` : ""}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">From → To</th>
                  <th className="py-2.5 px-3">Fee</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Approved by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.history.map((h: any) => (
                  <tr key={h.id}>
                    <td className="py-2.5 px-3 font-bold">{h.playerName}</td>
                    <td className="py-2.5 px-3">
                      {h.previousClubName} → <strong>{h.newClubName}</strong>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{formatCurrency(h.fee || 0)}</td>
                    <td className="py-2.5 px-3">{formatDate(h.transferDate)}</td>
                    <td className="py-2.5 px-3">{h.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      {data.requests.some((r: any) => r.status !== "PENDING") && (
        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-950">Past offers</h2>
          <div className="flex flex-wrap gap-2">
            {data.requests
              .filter((r: any) => r.status !== "PENDING")
              .slice(0, 30)
              .map((r: any) => (
                <span key={r.id} className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                  {r.club?.shortName} → {r.player?.fullName} <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </span>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

const escapeHtml = (v: string) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Select-all checkbox plus "approve / reject selected" buttons for one list of requests. */
function BulkBar({
  list,
  selected,
  setSelected,
  busy,
  onAct,
}: {
  list: any[];
  selected: Set<string>;
  setSelected: (fn: (prev: Set<string>) => Set<string>) => void;
  busy: boolean;
  onAct: (status: "ACCEPTED" | "REJECTED") => void;
}) {
  const ids = list.map((r) => r.id);
  const count = ids.filter((id) => selected.has(id)).length;
  const all = count === ids.length && ids.length > 0;
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (all) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  return (
    <div className={`flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-2xl border text-xs ${count ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}>
      <label className="inline-flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
        <input type="checkbox" checked={all} onChange={toggleAll} className="w-4 h-4 accent-emerald-600" />
        Select all ({ids.length})
      </label>
      <span className="text-slate-500">{count ? `${count} selected` : "Tick requests to act on several at once"}</span>
      <div className="w-full sm:w-auto sm:ml-auto flex gap-1.5 [&>*]:flex-1 sm:[&>*]:flex-none">
        <Button small variant="success" disabled={!count || busy} onClick={() => onAct("ACCEPTED")}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve selected{count ? ` (${count})` : ""}
        </Button>
        <Button small variant="secondary" disabled={!count || busy} onClick={() => onAct("REJECTED")}>
          <XCircle className="w-3.5 h-3.5" /> Reject selected
        </Button>
      </div>
    </div>
  );
}
