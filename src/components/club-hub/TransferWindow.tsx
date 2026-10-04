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
  const gold = "#E8B95A";

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0B0C0F");
  bg.addColorStop(0.55, "#121318");
  bg.addColorStop(1, "#1d1606");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Club colours glow (blurred crest)
  if (logo) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.filter = "blur(70px)";
    drawCover(ctx, logo, -200, 150, W + 400, 900);
    ctx.restore();
  }
  const glow = ctx.createRadialGradient(W / 2, 560, 50, W / 2, 560, 620);
  glow.addColorStop(0, "rgba(232,185,90,0.35)");
  glow.addColorStop(1, "rgba(232,185,90,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  // Light streaks
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const x = 120 + i * 210;
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 40, 0);
    ctx.lineTo(x - 260, H);
    ctx.lineTo(x - 300, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // Faint grid
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = "#fff";
  for (let x = 0; x <= W; x += 54) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const FONT = `"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif`;

  // Circle photo with a gold ring.
  const drawPhoto = (cx: number, cy: number, R: number) => {
    ctx.save();
    ctx.shadowColor = "rgba(232,185,90,0.6)";
    ctx.shadowBlur = 60;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 14, 0, Math.PI * 2);
    const ring = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    ring.addColorStop(0, "#F7DC8B");
    ring.addColorStop(0.5, "#C79A3B");
    ring.addColorStop(1, "#8a6420");
    ctx.fillStyle = ring;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    if (photo) drawCover(ctx, photo, cx - R, cy - R, R * 2, R * 2);
    else {
      ctx.fillStyle = "#fff";
      ctx.font = `900 ${Math.round(R * 0.75)}px ${FONT}`;
      ctx.fillText((player.fullName || "?").charAt(0).toUpperCase(), cx, cy + R * 0.26);
    }
    ctx.restore();
  };

  // White rounded tile with a club logo.
  const drawBadge = (img: HTMLImageElement | null, x: number, y: number, size: number, dim = false) => {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 30;
    roundRect(ctx, x, y, size, size, size * 0.21);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
    if (!img) return;
    ctx.save();
    roundRect(ctx, x + 10, y + 10, size - 20, size - 20, size * 0.17);
    ctx.clip();
    if (dim) ctx.filter = "grayscale(0.6)";
    drawCover(ctx, img, x + 10, y + 10, size - 20, size - 20);
    ctx.restore();
  };

  const ribbon = (text: string) => {
    ctx.font = `900 34px ${FONT}`;
    const rw = Math.max(560, ctx.measureText(text).width + 120);
    const rx = (W - rw) / 2;
    roundRect(ctx, rx, 1185, rw, 74, 37);
    const rib = ctx.createLinearGradient(rx, 0, rx + rw, 0);
    rib.addColorStop(0, "#F7DC8B");
    rib.addColorStop(1, "#C79A3B");
    ctx.fillStyle = rib;
    ctx.fill();
    ctx.fillStyle = "#0B0C0F";
    ctx.fillText(text, W / 2, 1234);
  };

  // Top label
  ctx.fillStyle = gold;
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText("O F F I C I A L   T R A N S F E R", W / 2, 110);

  if (fromClub) {
    // ---------- Club to club ----------
    ctx.fillStyle = "#fff";
    fitFont(ctx, player.fullName.toUpperCase(), W - 140, 92);
    ctx.fillText(player.fullName.toUpperCase(), W / 2, 215);

    // Bigger player photo, smaller club badges underneath.
    drawPhoto(W / 2, 560, 275);

    const bs = 150;
    const by = 885;
    const lx = W / 2 - 270 - bs / 2;
    const rx2 = W / 2 + 270 - bs / 2;
    drawBadge(fromLogo, lx, by, bs, true);
    drawBadge(logo, rx2, by, bs);

    // Arrow between the clubs
    const ay = by + bs / 2;
    ctx.save();
    ctx.strokeStyle = gold;
    ctx.fillStyle = gold;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lx + bs + 34, ay);
    ctx.lineTo(rx2 - 52, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx2 - 24, ay);
    ctx.lineTo(rx2 - 62, ay - 26);
    ctx.lineTo(rx2 - 62, ay + 26);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Club names
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = `800 22px ${FONT}`;
    ctx.fillText("LEAVES", lx + bs / 2, by + bs + 40);
    ctx.fillStyle = gold;
    ctx.fillText("JOINS", rx2 + bs / 2, by + bs + 40);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    fitFont(ctx, fromClub.name.toUpperCase(), 380, 32, 800);
    ctx.fillText(fromClub.name.toUpperCase(), lx + bs / 2, by + bs + 80);
    ctx.fillStyle = "#fff";
    fitFont(ctx, club.name.toUpperCase(), 380, 32, 900);
    ctx.fillText(club.name.toUpperCase(), rx2 + bs / 2, by + bs + 80);

    ribbon("HERE WE GO!  ·  CLUB TO CLUB");
  } else {
    // ---------- New / free signing ----------
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    fitFont(ctx, "WELCOME TO", W - 160, 84);
    ctx.fillText("WELCOME TO", W / 2, 205);
    ctx.fillStyle = gold;
    fitFont(ctx, club.name.toUpperCase(), W - 140, 92);
    ctx.fillText(club.name.toUpperCase(), W / 2, 305);

    const cx = W / 2;
    const cy = 680;
    const R = 270;
    drawPhoto(cx, cy, R);
    if (logo) {
      const bs = 190;
      drawBadge(logo, cx + R - bs * 0.62, cy + R - bs * 0.72, bs);
    }

    ctx.fillStyle = "#fff";
    fitFont(ctx, player.fullName.toUpperCase(), W - 140, 96);
    ctx.fillText(player.fullName.toUpperCase(), W / 2, 1110);

    ribbon(isFreeAgent(player) ? "HERE WE GO!  ·  FREE AGENT SIGNING" : "HERE WE GO!  ·  NEW SIGNING");
  }

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText("NECOB · NATIONAL eFOOTBALL COMMUNITY OF BANGLADESH", W / 2, 1310);
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
