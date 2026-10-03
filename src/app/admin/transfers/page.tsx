"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, X, Loader2, ExternalLink } from "lucide-react";
import { toast, confirmDialog } from "@/lib/feedback";
import { CONTRACT_DAYS, FREEZE_DAYS } from "@/lib/squad";
import { api, Badge, Button, Empty, Notice, PageHeader, inputCls, statusTone } from "@/components/admin/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminTransfersPage() {
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [buyer, setBuyer] = useState<Record<string, string>>({});

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
        {signings.length === 0 ? (
          <Empty>No signing requests waiting.</Empty>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {signings.map((r: any) => (
              <div key={r.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.player?.avatar} alt="" className="w-12 h-12 rounded-full object-cover bg-slate-100" />
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-950 text-sm truncate">{r.player?.fullName}</div>
                    <div className="text-slate-500 font-mono truncate">{r.player?.konamiId || `@${r.player?.username}`}</div>
                    {r.player?.clubId && <div className="text-rose-600 font-bold">Already in a club now</div>}
                  </div>
                  <span className="text-slate-400 font-black">→</span>
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.club?.logo} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-950 truncate">{r.club?.name}</div>
                      <div className="text-slate-500">Main Team Squad · Seat {r.seat}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{formatDate(r.createdAt)}</span>
                    {r.postLink && (
                      <a href={r.postLink} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100">
                        <ExternalLink className="w-3.5 h-3.5" /> Facebook post
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1.5">
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
        {pending.length === 0 ? (
          <Empty>No pending offers.</Empty>
        ) : (
          <div className="space-y-2">
            {pending.map((r: any) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 text-xs">
                <div>
                  <div className="font-bold text-slate-950">
                    {r.club?.name} → {r.player?.fullName}
                  </div>
                  <div className="text-slate-500">
                    Offer {formatCurrency(r.offeredFee)}
                    {r.proposedSalary ? ` · salary ${formatCurrency(r.proposedSalary)}` : ""} · {formatDate(r.createdAt)}
                  </div>
                  {r.message && <div className="text-slate-600 italic mt-1">“{r.message}”</div>}
                </div>
                <div className="flex gap-1.5">
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
                    <div className="font-bold text-slate-950">{l.player.fullName}</div>
                    <div className="text-slate-500">{l.player.club?.name || "Free agent"} · asking {formatCurrency(l.askingPrice)}</div>
                  </div>
                  <Button small variant="ghost" onClick={() => run(() => api("/api/admin/transfers", { method: "POST", json: { action: "CLOSE", listingId: l.id } }), "Listing removed.")} title="Remove listing">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex gap-2">
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
          <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
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
