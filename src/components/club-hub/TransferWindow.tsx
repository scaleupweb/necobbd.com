"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Search, Lock, Unlock, X, Loader2, CheckCircle2, Clock, XCircle, Snowflake, FileSignature, Image as ImageIcon, Download, Share2, ExternalLink, UserPlus, LayoutGrid, Table2 } from "lucide-react";
import { toast } from "@/lib/feedback";
import { formatDate } from "@/lib/utils";
import { SQUADS, CONTRACT_DAYS, FREEZE_DAYS, seatLayout, contractDaysLeft, isFrozen, freezeLeft, isFreeAgent } from "@/lib/squad";
import { useClubHub } from "./ClubHubContext";
import { loadImage, fitFont, drawCover, roundRect } from "./canvas";

const input = "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-black focus:bg-white text-sm";
const PAGE = 40;

function usePlayers() {
  const [players, setPlayers] = useState<any[] | null>(null);
  useEffect(() => {
    fetch("/api/players?sortBy=rating", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setPlayers(j.success ? j.data : []))
      .catch(() => setPlayers([]));
  }, []);
  return players;
}

const matches = (p: any, q: string) => !q || [p.fullName, p.username, p.konamiId].some((v) => String(v || "").toLowerCase().includes(q));

export function TransferWindow() {
  const [tab, setTab] = useState<"sign" | "card">("sign");
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-2xl bg-white border border-slate-200 p-1">
        {([
          ["sign", "Sign player", FileSignature],
          ["card", "Transfer card", ImageIcon],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${tab === id ? "bg-black text-white" : "text-slate-600 hover:text-black"}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      {tab === "sign" ? <SignPlayer /> : <TransferCard />}
    </div>
  );
}


const DAY_MS = 86400000;
type Layout = "cards" | "table";
type View = "all" | "noclub" | "free" | "club" | "ending";

/** Contract progress for a club player. */
function contractInfo(p: any) {
  const c = p.contract || {};
  const left = contractDaysLeft(c.endDate);
  const start = c.startDate ? new Date(c.startDate).getTime() : c.endDate ? new Date(c.endDate).getTime() - CONTRACT_DAYS * DAY_MS : 0;
  const day = start ? Math.min(CONTRACT_DAYS, Math.max(1, Math.floor((Date.now() - start) / DAY_MS) + 1)) : 0;
  return { left, day, pct: day ? Math.round((day / CONTRACT_DAYS) * 100) : 0, soon: left > 0 && left <= 30, known: !!c.endDate };
}

/** Status of a player in the Transfer Window: in a club (locked), Free Agent or no club. */
function statusOf(p: any): "club" | "free" | "noclub" {
  return p.club ? "club" : isFreeAgent(p) ? "free" : "noclub";
}

function ContractBar({ p, compact = false }: { p: any; compact?: boolean }) {
  const st = statusOf(p);
  if (st === "club") {
    const ci = contractInfo(p);
    return (
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
          <span className={ci.soon ? "text-amber-700" : "text-slate-500"}>{ci.known ? `Day ${ci.day}/${CONTRACT_DAYS}` : "Under contract"}</span>
          {ci.known && <span className={ci.soon ? "text-amber-700" : "text-slate-700"}>{ci.left}d left</span>}
        </div>
        <div className={`mt-1 ${compact ? "h-1" : "h-1.5"} rounded-full bg-slate-200 overflow-hidden`}>
          <div className={`h-full rounded-full ${ci.soon ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${ci.pct}%` }} />
        </div>
      </div>
    );
  }
  if (st === "free") {
    return <div className="text-[10px] font-bold text-emerald-700 truncate">{CONTRACT_DAYS}-day contract ended {formatDate(p.contract.endDate)}</div>;
  }
  return <div className="text-[10px] font-bold text-slate-400 truncate">Never signed to a club</div>;
}

function StatusPill({ p }: { p: any }) {
  const st = statusOf(p);
  if (st === "club")
    return (
      <span className="inline-flex items-center gap-1.5 max-w-full px-2 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600">
        <Lock className="w-3 h-3 shrink-0 text-slate-400" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.club.logo} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
        <span className="truncate">{p.club.name}</span>
      </span>
    );
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black ${st === "free" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>
      <Unlock className="w-3 h-3" /> {st === "free" ? "Free Agent" : "No club"}
    </span>
  );
}

function ActionButton({ p, requested, onPick, full = false }: { p: any; requested: boolean; onPick: () => void; full?: boolean }) {
  const w = full ? "w-full justify-center" : "";
  if (p.club)
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed ${w}`}>
        <Lock className="w-3.5 h-3.5" /> Locked
      </span>
    );
  if (requested)
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold ${w}`}>
        <Clock className="w-3.5 h-3.5" /> Requested
      </span>
    );
  return (
    <button onClick={onPick} className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 shrink-0 ${w}`}>
      <UserPlus className="w-3.5 h-3.5" /> Add to team
    </button>
  );
}

// =============================================================== Sign player

function SignPlayer() {
  const { club, reload } = useClubHub();
  const players = usePlayers();
  const [requests, setRequests] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [picked, setPicked] = useState<any>(null);
  const [view, setView] = useState<View>("all");
  const [layout, setLayout] = useState<Layout>("cards");

  // Remember the chosen layout on this device.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tw-layout");
      if (saved === "cards" || saved === "table") setLayout(saved);
    } catch {}
  }, []);
  const chooseLayout = (l: Layout) => {
    setLayout(l);
    try {
      localStorage.setItem("tw-layout", l);
    } catch {}
  };

  const loadRequests = () =>
    fetch("/api/me/club/transfer-requests", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j.success && setRequests(j.data))
      .catch(() => {});
  useEffect(() => {
    loadRequests();
  }, []);

  const pending = requests.filter((r) => r.status === "PENDING");
  const pendingIds = new Set(pending.map((r) => String(r.playerId)));
  const s = q.trim().toLowerCase();
  const list = useMemo(
    () =>
      (players || []).filter((p) => {
        const st = statusOf(p);
        if (view === "noclub" && st !== "noclub") return false;
        if (view === "free" && st !== "free") return false;
        if (view === "club" && st !== "club") return false;
        if (view === "ending" && !(st === "club" && contractInfo(p).soon)) return false;
        return matches(p, s);
      }),
    [players, s, view]
  );
  const counts = useMemo(() => {
    const all = players || [];
    return {
      all: all.length,
      noclub: all.filter((p) => statusOf(p) === "noclub").length,
      free: all.filter((p) => statusOf(p) === "free").length,
      club: all.filter((p) => statusOf(p) === "club").length,
      ending: all.filter((p) => statusOf(p) === "club" && contractInfo(p).soon).length,
    };
  }, [players]);
  useEffect(() => setShown(PAGE), [s, view]);

  const visible = list.slice(0, shown);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search player name, username or Konami UID…" className={`${input} pl-10`} />
          </div>
          <div className="inline-flex self-start rounded-xl bg-slate-100 p-1 shrink-0">
            {([
              ["cards", "Cards", LayoutGrid],
              ["table", "Table", Table2],
            ] as const).map(([v, l, Icon]) => (
              <button
                key={v}
                onClick={() => chooseLayout(v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${layout === v ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                <Icon className="w-4 h-4" /> {l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          {([
            ["all", "All"],
            ["noclub", "No club"],
            ["free", "Free Agents"],
            ["club", "In a club"],
            ["ending", "Contract ending ≤30d"],
          ] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-colors ${
                view === v ? "bg-black border-black text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {l} <span className={view === v ? "text-white/60" : "text-slate-400"}>{counts[v]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1"><Unlock className="w-3.5 h-3.5 text-sky-600" /> No club — never signed</span>
          <span className="inline-flex items-center gap-1"><Unlock className="w-3.5 h-3.5 text-emerald-600" /> Free Agent — {CONTRACT_DAYS}-day contract ended</span>
          <span className="inline-flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-slate-400" /> In a club — locked</span>
          <span className="sm:ml-auto font-bold">{players ? `${list.length} players` : "Loading…"}</span>
        </div>
      </div>

      {/* Results */}
      {players === null ? (
        <div className="rounded-3xl bg-white border border-slate-200 py-14 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>
      ) : !list.length ? (
        <div className="rounded-3xl bg-white border border-dashed border-slate-300 py-14 text-center text-sm text-slate-500">No player matches.</div>
      ) : layout === "cards" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {visible.map((p) => {
            const st = statusOf(p);
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border bg-white overflow-hidden transition-all ${
                  st === "club" ? "border-slate-200" : "border-emerald-200 hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                <div className={`h-1.5 ${st === "club" ? "bg-slate-200" : st === "free" ? "bg-emerald-500" : "bg-sky-500"}`} />
                <div className="p-3 sm:p-4 flex flex-col items-center text-center flex-1">
                  <div className="relative">
                    <span className={`block rounded-full p-[3px] ${st === "club" ? "bg-slate-200" : "bg-gradient-to-br from-[#C79A3B] via-[#f5d58a] to-[#8a6420]"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.avatar} alt="" loading="lazy" className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover bg-slate-100 ring-2 ring-white ${st === "club" ? "grayscale opacity-70" : ""}`} />
                    </span>
                    <span className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center ring-2 ring-white ${st === "club" ? "bg-slate-500 text-white" : "bg-emerald-500 text-white"}`}>
                      {st === "club" ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                  <Link href={`/players/${p.username}`} target="_blank" className="mt-3 w-full text-sm font-black text-slate-950 truncate hover:underline">{p.fullName}</Link>
                  <div className="w-full text-[11px] text-slate-500 font-mono truncate">{p.konamiId || `@${p.username}`}</div>
                  <div className="mt-2 max-w-full"><StatusPill p={p} /></div>
                  <div className="mt-3 w-full"><ContractBar p={p} /></div>
                  {isFrozen(p.frozenUntil) && <div className="mt-1 text-[10px] font-black text-sky-700">❄ Frozen · {freezeLeft(p.frozenUntil)}</div>}
                  <div className="mt-auto pt-3 w-full">
                    <ActionButton p={p} requested={pendingIds.has(String(p.id))} onPick={() => setPicked(p)} full />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Konami UID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-48">Contract</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((p) => (
                  <tr key={p.id} className={statusOf(p) === "club" ? "bg-slate-50/40" : "hover:bg-emerald-50/30"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.avatar} alt="" loading="lazy" className={`w-10 h-10 rounded-full object-cover bg-slate-100 ${p.club ? "grayscale opacity-70" : ""}`} />
                        <div className="min-w-0">
                          <Link href={`/players/${p.username}`} target="_blank" className="block text-sm font-bold text-slate-950 truncate max-w-[220px] hover:underline">{p.fullName}</Link>
                          <div className="text-[11px] text-slate-500 truncate">@{p.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-bold text-slate-700 whitespace-nowrap">{p.konamiId || "—"}</td>
                    <td className="px-4 py-3 max-w-[220px]"><StatusPill p={p} /></td>
                    <td className="px-4 py-3">
                      <ContractBar p={p} compact />
                      {isFrozen(p.frozenUntil) && <div className="mt-1 text-[10px] font-black text-sky-700">❄ {freezeLeft(p.frozenUntil)}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionButton p={p} requested={pendingIds.has(String(p.id))} onPick={() => setPicked(p)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {players && shown < list.length && (
        <div className="text-center">
          <button onClick={() => setShown((n) => n + PAGE)} className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800">
            Show more <span className="text-white/50 font-mono ml-1">{shown}/{list.length}</span>
          </button>
        </div>
      )}

      <MyRequests requests={requests} />

      {picked && (
        <SignSheet
          player={picked}
          club={club}
          pending={pending}
          onClose={() => setPicked(null)}
          onDone={async () => {
            setPicked(null);
            await Promise.all([loadRequests(), reload()]);
          }}
        />
      )}
    </div>
  );
}

function SignSheet({ player, club, pending, onClose, onDone }: { player: any; club: any; pending: any[]; onClose: () => void; onDone: () => void }) {
  const squads = SQUADS.map((sq) => {
    const count = (club.squad || []).filter((p: any) => (p.squad || "main") === sq.id).length;
    const reserved = pending.filter((r) => (r.squad || "main") === sq.id).length;
    return { ...sq, count, full: count + reserved >= sq.size };
  });
  const [squadId, setSquadId] = useState<string>(squads.find((x) => !x.full)?.id || "");
  const [seat, setSeat] = useState<number>(0);
  const [postLink, setPostLink] = useState("");
  const [busy, setBusy] = useState(false);

  const sq = squads.find((x) => x.id === squadId);
  const layout = sq ? seatLayout((club.squad || []).filter((p: any) => (p.squad || "main") === sq.id), sq.size) : [];
  const reservedSeats = new Set(pending.filter((r) => (r.squad || "main") === squadId).map((r) => r.seat));
  const start = new Date();
  const end = new Date(Date.now() + CONTRACT_DAYS * 86400000);
  const unfreeze = new Date(Date.now() + FREEZE_DAYS * 86400000);
  const linkOk = /^https?:\/\/([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.watch|fb\.me)\//i.test(postLink.trim());

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const submit = async () => {
    if (!squadId || !seat) return toast.error("Choose a squad and a seat");
    if (!linkOk) return toast.error("Paste the Facebook post link first");
    setBusy(true);
    try {
      const res = await fetch("/api/me/club/transfer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id, squad: squadId, seat, postLink: postLink.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Could not submit the request");
      toast.success("Transfer request sent to the admins");
      onDone();
    } catch (e: any) {
      toast.error(e.message);
      setBusy(false);
    }
  };

  const step = (n: number, title: string, done: boolean) => (
    <div className="flex items-center gap-2">
      <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${done ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"}`}>{done ? "✓" : n}</span>
      <span className="text-sm font-black text-slate-950">{title}</span>
    </div>
  );

  return (
    // Rendered on <body> so it always sits above the page and the phone's bottom bar.
    createPortal(
    <div className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-6" style={{ zIndex: 200 }}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div style={{ maxHeight: "92dvh" }} className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 bg-white border-b border-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={player.avatar} alt="" className="w-11 h-11 rounded-full object-cover bg-slate-100" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Sign player</div>
            <div className="text-base font-black text-slate-950 truncate">{player.fullName}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* 1. Squad */}
          <section className="space-y-2.5">
            {step(1, "Choose squad", !!squadId)}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {squads.map((x) => (
                <button
                  key={x.id}
                  disabled={x.full}
                  onClick={() => {
                    setSquadId(x.id);
                    setSeat(0);
                  }}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${
                    x.full ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed" : squadId === x.id ? "border-black bg-black text-white" : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-bold">{x.label}</span>
                    <span className={`text-[11px] ${squadId === x.id && !x.full ? "text-white/60" : "text-slate-500"}`}>
                      {x.count}/{x.size} players
                    </span>
                  </span>
                  {x.full ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-600"><Lock className="w-3.5 h-3.5" /> Full</span>
                  ) : (
                    <Unlock className="w-4 h-4 opacity-60" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* 2. Seat */}
          {sq && (
            <section className="space-y-2.5">
              {step(2, "Choose seat", !!seat)}
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {layout.map((p: any, i: number) => {
                  const n = i + 1;
                  const taken = !!p || reservedSeats.has(n);
                  return (
                    <button
                      key={n}
                      disabled={taken}
                      onClick={() => setSeat(n)}
                      title={p ? `Seat ${n}: ${p.fullName}` : reservedSeats.has(n) ? `Seat ${n}: reserved by a pending request` : `Seat ${n}`}
                      className={`aspect-square rounded-xl text-xs font-black font-mono flex items-center justify-center transition-colors ${
                        p
                          ? "bg-slate-100 text-slate-300 cursor-not-allowed overflow-hidden"
                          : reservedSeats.has(n)
                            ? "bg-amber-50 text-amber-400 cursor-not-allowed"
                            : seat === n
                              ? "bg-[#C79A3B] text-black ring-2 ring-[#C79A3B] ring-offset-2"
                              : "border-2 border-dashed border-slate-200 text-slate-500 hover:border-[#C79A3B] hover:text-black"
                      }`}
                    >
                      {p ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar} alt="" className="w-full h-full object-cover opacity-40 grayscale" />
                      ) : (
                        n
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">Grey seats are taken, amber seats are reserved by your other pending requests.</p>
            </section>
          )}

          {/* 3. Contract */}
          {seat > 0 && (
            <section className="space-y-2.5">
              {step(3, "Contract", true)}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700">
                    <FileSignature className="w-3.5 h-3.5" /> {CONTRACT_DAYS}-day contract
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {formatDate(start.toISOString())} → {formatDate(end.toISOString())}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">Counts down from the day the admins approve. When it ends the player becomes a Free Agent and leaves the club.</p>
                </div>
                <div className="rounded-2xl bg-sky-50 border border-sky-200 p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-sky-700">
                    <Snowflake className="w-3.5 h-3.5" /> {FREEZE_DAYS}-day freeze
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">Until about {formatDate(unfreeze.toISOString())}</div>
                  <p className="text-[11px] text-slate-600 mt-1">After joining, the player can't leave or move clubs for {FREEZE_DAYS} days.</p>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600">
                <b className="text-slate-900">{player.fullName}</b> → <b className="text-slate-900">{club.name}</b> · {sq?.label} · Seat <b className="text-slate-900">{seat}</b>
              </div>
            </section>
          )}

          {/* 4. Facebook post */}
          {seat > 0 && (
            <section className="space-y-2.5">
              {step(4, "Facebook post link", linkOk)}
              <input
                type="url"
                value={postLink}
                onChange={(e) => setPostLink(e.target.value)}
                placeholder="https://www.facebook.com/…/posts/…"
                className={input}
              />
              <p className="text-[11px] text-slate-500">
                Make a transfer card in the <b>Transfer card</b> tab, post it on Facebook, then paste the post link here. Requests can&apos;t be sent without it.
              </p>
            </section>
          )}
        </div>

        <div className="sticky bottom-0 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white border-t border-slate-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-bold">Cancel</button>
          <button
            onClick={submit}
            disabled={busy || !squadId || !seat || !linkOk}
            className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit request
          </button>
        </div>
      </div>
    </div>,
    document.body
    )
  );
}

function MyRequests({ requests }: { requests: any[] }) {
  if (!requests.length) return null;
  const tone: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-800",
    ACCEPTED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-rose-50 text-rose-700",
    CANCELLED: "bg-slate-100 text-slate-500",
  };
  const icon: Record<string, any> = { PENDING: Clock, ACCEPTED: CheckCircle2, REJECTED: XCircle, CANCELLED: XCircle };
  return (
    <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-500">Your transfer requests</div>
      <div className="divide-y divide-slate-100">
        {requests.map((r) => {
          const Icon = icon[r.status] || Clock;
          return (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.player?.avatar} alt="" className="w-9 h-9 rounded-full object-cover bg-slate-100" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-950 truncate">{r.player?.fullName}</div>
                <div className="text-[11px] text-slate-500">
                  Seat {r.seat} · {formatDate(r.createdAt)}
                  {r.postLink && (
                    <>
                      {" · "}
                      <a href={r.postLink} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-0.5 font-bold text-blue-600 hover:underline">
                        Post <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${tone[r.status] || tone.PENDING}`}>
                <Icon className="w-3.5 h-3.5" /> {r.status === "ACCEPTED" ? "APPROVED" : r.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================== Transfer card

async function renderCard(canvas: HTMLCanvasElement, player: any, club: any) {
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // Coming from another club → club-to-club poster; otherwise a welcome / new-signing poster.
  const fromClub = player.club && player.club.id !== club.id ? player.club : null;
  const [photo, logo, fromLogo] = await Promise.all([loadImage(player.avatar), loadImage(club.logo), fromClub ? loadImage(fromClub.logo) : Promise.resolve(null)]);
  const FONT = `"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif`;
  const gold = "#E8B95A";
  const goldGrad = (x0: number, y0: number, x1: number, y1: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "#FFE9A8");
    g.addColorStop(0.45, "#E8B95A");
    g.addColorStop(1, "#9A6E22");
    return g;
  };

  // Name split: smaller first names, a big surname.
  const parts = String(player.fullName || "").trim().toUpperCase().split(/\s+/).filter(Boolean);
  const surname = parts.length > 1 ? parts.pop()! : parts[0] || "";
  const firstNames = parts.length && parts[0] !== surname ? parts.join(" ") : "";

  // ---------------------------------------------------------------- background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#07080B");
  bg.addColorStop(0.5, "#101116");
  bg.addColorStop(1, "#1a1407");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Club colours: the crest blown up and blurred.
  if (logo) {
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.filter = "blur(90px) saturate(1.4)";
    drawCover(ctx, logo, -260, 120, W + 520, 1000);
    ctx.restore();
  }

  // Spotlight from above.
  const spot = ctx.createRadialGradient(W / 2, 520, 40, W / 2, 520, 700);
  spot.addColorStop(0, "rgba(255,214,120,0.32)");
  spot.addColorStop(0.5, "rgba(232,185,90,0.10)");
  spot.addColorStop(1, "rgba(232,185,90,0)");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, W, H);

  // Light beams fanning down-left from the top-right corner.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const ox = W + 40;
  const oy = -40;
  const len = 1900;
  for (let i = 0; i < 6; i++) {
    const t = ((118 + i * 7) * Math.PI) / 180; // y grows downward, so these point down-left
    const half = 0.022;
    const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(t) * len, oy + Math.sin(t) * len);
    g.addColorStop(0, `rgba(255,220,140,${0.1 - i * 0.01})`);
    g.addColorStop(1, "rgba(255,220,140,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(t - half) * len, oy + Math.sin(t - half) * len);
    ctx.lineTo(ox + Math.cos(t + half) * len, oy + Math.sin(t + half) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Halftone dots in two corners.
  const halftone = (ox: number, oy: number, size: number, dirX: number, dirY: number) => {
    ctx.save();
    ctx.fillStyle = "rgba(232,185,90,0.16)";
    for (let y = 0; y < size; y += 22) {
      for (let x = 0; x < size; x += 22) {
        const d = 1 - Math.hypot(x, y) / size;
        if (d <= 0) continue;
        ctx.beginPath();
        ctx.arc(ox + dirX * x, oy + dirY * y, 1 + d * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };
  halftone(40, 40, 360, 1, 1);
  halftone(W - 40, H - 40, 360, -1, -1);

  // Huge outlined surname behind the player.
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ghost = surname || "SIGNED";
  const gs = fitFont(ctx, ghost, W * 1.25, 300, 900, FONT);
  ctx.font = `900 ${gs}px ${FONT}`;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.strokeText(ghost, W / 2, fromClub ? 560 : 700);
  ctx.strokeText(ghost, W / 2, (fromClub ? 560 : 700) + gs * 0.92);
  ctx.restore();

  // Vignette.
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.78);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Thin gold frame with corner accents.
  ctx.save();
  ctx.strokeStyle = "rgba(232,185,90,0.35)";
  ctx.lineWidth = 2;
  roundRect(ctx, 28, 28, W - 56, H - 56, 26);
  ctx.stroke();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  const c = 70;
  for (const [x, y, sx, sy] of [
    [28, 28, 1, 1],
    [W - 28, 28, -1, 1],
    [28, H - 28, 1, -1],
    [W - 28, H - 28, -1, -1],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x + sx * 4, y + sy * c);
    ctx.lineTo(x + sx * 4, y + sy * 4);
    ctx.lineTo(x + sx * c, y + sy * 4);
    ctx.stroke();
  }
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // ---------------------------------------------------------------- pieces
  /** Rounded-square portrait with a gold frame, glow and a dark fade at the bottom. */
  const drawPortrait = (x: number, y: number, size: number) => {
    const r = size * 0.09;
    ctx.save();
    ctx.shadowColor = "rgba(232,185,90,0.55)";
    ctx.shadowBlur = 80;
    roundRect(ctx, x - 12, y - 12, size + 24, size + 24, r + 10);
    ctx.fillStyle = goldGrad(x, y, x + size, y + size);
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, y, size, size, r);
    ctx.clip();
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(x, y, size, size);
    if (photo) drawCover(ctx, photo, x, y, size, size);
    else {
      ctx.fillStyle = "#fff";
      ctx.font = `900 ${Math.round(size * 0.4)}px ${FONT}`;
      ctx.fillText((player.fullName || "?").charAt(0).toUpperCase(), x + size / 2, y + size * 0.64);
    }
    const fade = ctx.createLinearGradient(0, y + size * 0.62, 0, y + size);
    fade.addColorStop(0, "rgba(7,8,11,0)");
    fade.addColorStop(1, "rgba(7,8,11,0.7)");
    ctx.fillStyle = fade;
    ctx.fillRect(x, y, size, size);
    // glossy sheen
    const sheen = ctx.createLinearGradient(x, y, x + size, y + size);
    sheen.addColorStop(0, "rgba(255,255,255,0.14)");
    sheen.addColorStop(0.35, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, size, size);
    ctx.restore();
  };

  /** White rounded tile with a club crest. */
  const drawBadge = (img: HTMLImageElement | null, x: number, y: number, size: number, dim = false) => {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 36;
    roundRect(ctx, x - 6, y - 6, size + 12, size + 12, size * 0.24);
    ctx.fillStyle = dim ? "#9ca3af" : goldGrad(x, y, x + size, y + size);
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, y, size, size, size * 0.21);
    ctx.fillStyle = "#fff";
    ctx.fill();
    if (img) {
      roundRect(ctx, x + 8, y + 8, size - 16, size - 16, size * 0.17);
      ctx.clip();
      if (dim) ctx.filter = "grayscale(0.7)";
      drawCover(ctx, img, x + 8, y + 8, size - 16, size - 16);
    }
    ctx.restore();
  };

  /** Tilted gold tag, e.g. "HERE WE GO!". */
  const tag = (text: string, x: number, y: number, angle = -0.07) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `900 40px ${FONT}`;
    const tw = ctx.measureText(text).width + 64;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.moveTo(-tw / 2 + 18, -36);
    ctx.lineTo(tw / 2, -36);
    ctx.lineTo(tw / 2 - 18, 36);
    ctx.lineTo(-tw / 2, 36);
    ctx.closePath();
    ctx.fillStyle = goldGrad(-tw / 2, -36, tw / 2, 36);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#0B0C0F";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 3);
    ctx.restore();
  };

  /** Row of outlined info chips, centred. */
  const chips = (items: string[], y: number) => {
    const list = items.filter(Boolean);
    if (!list.length) return;
    ctx.font = `800 26px ${FONT}`;
    const pad = 30;
    const gap = 16;
    const widths = list.map((t) => ctx.measureText(t).width + pad * 2);
    let x = (W - widths.reduce((a, b) => a + b, 0) - gap * (list.length - 1)) / 2;
    list.forEach((t, i) => {
      ctx.save();
      roundRect(ctx, x, y, widths[i], 56, 28);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.strokeStyle = "rgba(232,185,90,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t, x + widths[i] / 2, y + 30);
      ctx.restore();
      x += widths[i] + gap;
    });
  };

  /** Spaced-out small heading with gold rules either side. */
  const kicker = (text: string, y: number) => {
    ctx.save();
    ctx.font = `800 26px ${FONT}`;
    const spaced = text.split("").join(String.fromCharCode(8202));
    ctx.fillStyle = gold;
    ctx.fillText(spaced, W / 2, y);
    const tw = ctx.measureText(spaced).width;
    ctx.strokeStyle = "rgba(232,185,90,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - tw / 2 - 90, y - 9);
    ctx.lineTo(W / 2 - tw / 2 - 24, y - 9);
    ctx.moveTo(W / 2 + tw / 2 + 24, y - 9);
    ctx.lineTo(W / 2 + tw / 2 + 90, y - 9);
    ctx.stroke();
    ctx.restore();
  };

  /** First names small, surname big in gold. */
  const nameBlock = (yFirst: number, ySurname: number, size: number) => {
    if (firstNames) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      fitFont(ctx, firstNames, W - 200, Math.round(size * 0.45), 800, FONT);
      ctx.fillText(firstNames, W / 2, yFirst);
    }
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 20;
    fitFont(ctx, surname, W - 140, size, 900, FONT);
    ctx.fillStyle = goldGrad(0, ySurname - size, 0, ySurname);
    ctx.fillText(surname, W / 2, firstNames ? ySurname : ySurname - size * 0.25);
    ctx.restore();
  };

  const month = new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" }).toUpperCase();
  const position = player.preferredPosition ? String(player.preferredPosition).toUpperCase() : "";

  if (fromClub) {
    // ---------- Club to club ----------
    kicker("OFFICIAL · CLUB TO CLUB", 112);
    ctx.fillStyle = "#fff";
    fitFont(ctx, "TRANSFER COMPLETE", W - 200, 74, 900, FONT);
    ctx.fillText("TRANSFER COMPLETE", W / 2, 200);

    const size = 500;
    const px = (W - size) / 2;
    const py = 250;
    drawPortrait(px, py, size);
    tag("HERE WE GO!", px + 40, py + 10);

    nameBlock(py + size + 76, py + size + 176, 110);

    // From → To
    const bs = 128;
    const by = 1000;
    const lx = W / 2 - 250 - bs / 2;
    const rx = W / 2 + 250 - bs / 2;
    drawBadge(fromLogo, lx, by, bs, true);
    drawBadge(logo, rx, by, bs);
    const ay = by + bs / 2;
    ctx.save();
    const arrow = ctx.createLinearGradient(lx + bs, 0, rx, 0);
    arrow.addColorStop(0, "rgba(232,185,90,0.25)");
    arrow.addColorStop(1, gold);
    ctx.strokeStyle = arrow;
    ctx.fillStyle = gold;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.setLineDash([2, 18]);
    ctx.beginPath();
    ctx.moveTo(lx + bs + 40, ay);
    ctx.lineTo(rx - 60, ay);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(rx - 26, ay);
    ctx.lineTo(rx - 64, ay - 26);
    ctx.lineTo(rx - 64, ay + 26);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.font = `800 20px ${FONT}`;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("FROM", lx + bs / 2, by + bs + 38);
    ctx.fillStyle = gold;
    ctx.fillText("TO", rx + bs / 2, by + bs + 38);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    fitFont(ctx, fromClub.name.toUpperCase(), 360, 28, 800, FONT);
    ctx.fillText(fromClub.name.toUpperCase(), lx + bs / 2, by + bs + 74);
    ctx.fillStyle = "#fff";
    fitFont(ctx, club.name.toUpperCase(), 360, 28, 900, FONT);
    ctx.fillText(club.name.toUpperCase(), rx + bs / 2, by + bs + 74);
  } else {
    // ---------- New / free signing ----------
    kicker(isFreeAgent(player) ? "OFFICIAL · FREE AGENT SIGNING" : "OFFICIAL · NEW SIGNING", 112);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `800 46px ${FONT}`;
    ctx.fillText("WELCOME TO", W / 2, 186);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 18;
    fitFont(ctx, club.name.toUpperCase(), W - 160, 84, 900, FONT);
    ctx.fillStyle = "#fff";
    ctx.fillText(club.name.toUpperCase(), W / 2, 274);
    ctx.restore();

    const size = 600;
    const px = (W - size) / 2;
    const py = 320;
    drawPortrait(px, py, size);
    tag("HERE WE GO!", px + 50, py + 14);
    if (logo) drawBadge(logo, px + size - 120, py + size - 120, 170);

    nameBlock(py + size + 78, py + size + 182, 118);
    chips([position, `${CONTRACT_DAYS}-DAY CONTRACT`, month], py + size + 220);
  }

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `700 22px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("NECOB · NATIONAL eFOOTBALL COMMUNITY OF BANGLADESH", W / 2, H - 52);
}

function TransferCard() {
  const { club } = useClubHub();
  const players = usePlayers();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<any>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobRef = useRef<Blob | null>(null);
  const s = q.trim().toLowerCase();
  const list = useMemo(() => (s ? (players || []).filter((p) => matches(p, s)).slice(0, 12) : []), [players, s]);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const generate = async () => {
    if (!picked || !canvasRef.current) return;
    setBusy(true);
    try {
      await renderCard(canvasRef.current, picked, club);
      const blob: Blob | null = await new Promise((res) => {
        try {
          canvasRef.current!.toBlob((b) => res(b), "image/png");
        } catch {
          res(null);
        }
      });
      if (!blob) throw new Error("Could not create the image");
      blobRef.current = blob;
      setUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
    } catch (e: any) {
      toast.error(e.message || "Could not create the image");
    } finally {
      setBusy(false);
    }
  };

  const fileName = picked ? `transfer-${picked.username}-${club.shortName || "club"}.png`.toLowerCase() : "transfer.png";

  const download = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const share = async () => {
    const blob = blobRef.current;
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    try {
      if ((navigator as any).canShare?.({ files: [file] })) await (navigator as any).share({ files: [file], title: `${picked.fullName} → ${club.name}` });
      else download();
    } catch {
      /* user closed the share sheet */
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-4 items-start">
      <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Club</div>
          <div className="mt-1.5 flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={club.logo} alt="" className="w-10 h-10 rounded-xl object-cover bg-white" />
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-950 truncate">{club.name}</div>
              <div className="text-[11px] text-slate-500">Selected automatically</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Player joining</div>
          {picked ? (
            <div className="mt-1.5 flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={picked.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-white" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-slate-950 truncate">{picked.fullName}</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">{picked.konamiId || `@${picked.username}`}</div>
              </div>
              <button onClick={() => setPicked(null)} className="text-xs font-bold text-slate-500 hover:text-black">Change</button>
            </div>
          ) : (
            <div className="mt-1.5 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search player name or UID…" className={`${input} pl-10`} />
              </div>
              {players === null && <div className="text-xs text-slate-400">Loading players…</div>}
              {list.length > 0 && (
                <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {list.map((p) => (
                    <button key={p.id} onClick={() => setPicked(p)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.avatar} alt="" className="w-8 h-8 rounded-full object-cover bg-slate-100" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-950 truncate">{p.fullName}</span>
                        <span className="block text-[11px] text-slate-500 font-mono truncate">{p.konamiId || `@${p.username}`}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {s && players && !list.length && <div className="text-xs text-slate-500">No player matches “{q}”.</div>}
            </div>
          )}
        </div>

        <button onClick={generate} disabled={!picked || busy} className="w-full py-3 rounded-xl bg-black text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />} Generate transfer card
        </button>
        <p className="text-[11px] text-slate-500">Download the card, post it on your club&apos;s Facebook page, then paste the post link in the Sign player tab.</p>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-3">
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Transfer card" className="w-full max-w-md mx-auto rounded-2xl shadow-lg" />
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <button onClick={download} className="flex-1 py-3 rounded-xl bg-[#C79A3B] text-black text-sm font-bold inline-flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download image
              </button>
              <button onClick={share} className="sm:w-auto px-4 py-3 rounded-xl bg-slate-100 text-sm font-bold inline-flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </>
        ) : (
          <div className="aspect-[4/5] max-w-md mx-auto rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6">
            <ImageIcon className="w-10 h-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">Your transfer card appears here</p>
            <p className="text-xs text-slate-500">Pick the player and press Generate.</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
