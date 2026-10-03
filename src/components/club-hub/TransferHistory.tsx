"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Search, Loader2, Clock, CheckCircle2, XCircle, Facebook, History, Users } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  free: "Registered",
  registered: "Registered",
  signing: "Signed",
  transfer: "Transfer",
  released: "Left club",
  expired: "Contract ended",
};

const REQ_TONE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export function ClubTransferHistory() {
  const [data, setData] = useState<{ history: any[]; requests: any[] } | null>(null);
  const [error, setError] = useState("");
  const [dir, setDir] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/me/club/history", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => (j.success ? setData(j.data) : setError(j.error?.message || "Could not load history")))
      .catch(() => setError("Could not load history"));
  }, []);

  const history = data?.history || [];
  const requests = data?.requests || [];
  const s = q.trim().toLowerCase();
  const list = useMemo(
    () =>
      history.filter((h) => (dir === "ALL" || h.direction === dir) && (!s || [h.player.fullName, h.player.username, h.player.konamiId, h.otherClub?.name].some((v) => String(v || "").toLowerCase().includes(s)))),
    [history, dir, s]
  );

  if (error) return <div className="rounded-3xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">{error}</div>;
  if (!data) return <div className="rounded-3xl bg-white border border-slate-200 py-14 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>;

  const ins = history.filter((h) => h.direction === "IN").length;
  const outs = history.length - ins;
  const stillHere = history.filter((h) => h.direction === "IN" && h.player.stillHere).length;
  const pending = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
        {[
          [History, "Total moves", history.length, "text-slate-950"],
          [ArrowDownLeft, "Joined (IN)", ins, "text-emerald-700"],
          [ArrowUpRight, "Left (OUT)", outs, "text-rose-700"],
          [Users, "Still in squad", stillHere, "text-slate-950"],
          [Clock, "Pending requests", pending.length, "text-amber-700"],
        ].map(([Icon, label, value, tone]: any) => (
          <div key={label} className="rounded-2xl bg-white border border-slate-200 p-3 sm:p-4">
            <Icon className={`w-4 h-4 ${tone}`} />
            <div className={`mt-1.5 text-2xl font-black font-mono ${tone}`}>{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Requests */}
      {requests.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-500">Transfer requests</div>
          <div className="divide-y divide-slate-100">
            {requests.slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.player?.avatar} alt="" className="w-9 h-9 rounded-full object-cover bg-slate-100" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-950 truncate">{r.player?.fullName}</div>
                  <div className="text-[11px] text-slate-500">
                    {r.type === "SIGNING" ? `Transfer Window · seat ${r.seat}` : `Market offer · ${formatCurrency(r.offeredFee)}`} · {formatDate(r.createdAt)}
                    {r.postLink && (
                      <>
                        {" · "}
                        <a href={r.postLink} target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-blue-600 hover:underline">Post</a>
                      </>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${REQ_TONE[r.status] || REQ_TONE.PENDING}`}>
                  {r.status === "PENDING" ? <Clock className="w-3.5 h-3.5" /> : r.status === "ACCEPTED" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {r.status === "ACCEPTED" ? "APPROVED" : r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search player, UID or club…"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-black focus:bg-white"
            />
          </div>
          <div className="inline-flex self-start rounded-xl bg-slate-100 p-1">
            {([
              ["ALL", "All"],
              ["IN", "In"],
              ["OUT", "Out"],
            ] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setDir(v)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${dir === v ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {!list.length ? (
          <div className="py-14 text-center text-sm text-slate-500">{history.length ? "No moves match." : "No transfers recorded for this club yet."}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {list.map((h) => {
              const isIn = h.direction === "IN";
              return (
                <div key={h.id} className="flex gap-3 px-4 py-3.5">
                  <span className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isIn ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.player.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {h.player.username ? (
                        <Link href={`/players/${h.player.username}`} className="text-sm font-bold text-slate-950 hover:underline truncate">
                          {h.player.fullName}
                        </Link>
                      ) : (
                        <span className="text-sm font-bold text-slate-950 truncate">{h.player.fullName}</span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase ${isIn ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {isIn ? "IN" : "OUT"} · {TYPE_LABEL[h.type] || h.type}
                      </span>
                      {isIn && !h.player.stillHere && <span className="text-[10px] font-bold text-slate-400">no longer in squad</span>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500">
                      <span>{formatDate(h.date)}</span>
                      <span>·</span>
                      <span>{isIn ? "from" : "to"}</span>
                      {h.otherClub?.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.otherClub.logo} alt="" className="w-4 h-4 rounded object-cover" />
                      )}
                      {h.otherClub?.slug ? (
                        <Link href={`/clubs/${h.otherClub.slug}`} className="font-bold text-slate-700 hover:underline">
                          {h.otherClub.name}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-700">{h.otherClub?.name}</span>
                      )}
                    </div>
                    {(h.contractEnd || h.postLink) && isIn && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
                        {h.contractEnd && (
                          <span className="text-slate-500">
                            Contract <b className="text-slate-800">{formatDate(h.date)} → {formatDate(h.contractEnd)}</b>
                          </span>
                        )}
                        {h.postLink && (
                          <a href={h.postLink} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline">
                            <Facebook className="w-3 h-3" /> Post
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {h.shirtNo ? <div className="text-sm font-black font-mono text-[#B0852A]">#{h.shirtNo}</div> : h.seat ? <div className="text-xs font-black font-mono text-[#B0852A]">Seat {h.seat}</div> : null}
                    {h.fee ? <div className="text-[10px] font-bold text-slate-400">{formatCurrency(h.fee)}</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
