"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Users, Shield, UserX, BadgeCheck, Sparkles, ArrowUpRight, Smartphone } from "lucide-react";
import { PLAYER_POSITIONS } from "@/lib/constants";
import { getFormColor } from "@/lib/utils";
import { CopyButton } from "@/components/ui/CopyButton";
import { isFreeAgent, noClubLabel, ratingText } from "@/lib/squad";

const PAGE = 48;

const SORTS = [
  { value: "rating", label: "Rating (Elo)" },
  { value: "goals", label: "Goals" },
  { value: "winRate", label: "Win rate" },
  { value: "marketValue", label: "Market value" },
  { value: "motm", label: "MOTM awards" },
];

type ClubFilter = "ALL" | "CLUB" | "FREE" | "NOCLUB";

export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState("ALL");
  const [clubFilter, setClubFilter] = useState<ClubFilter>("ALL");
  const [sortBy, setSortBy] = useState("rating");
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/players?sortBy=${sortBy}`)
      .then((r) => r.json())
      .then((json) => alive && json.success && setPlayers(json.data))
      .catch(console.error)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [sortBy]);

  // Start from the top of the list whenever the filters change.
  useEffect(() => setShown(PAGE), [search, pos, clubFilter, sortBy]);

  const stats = useMemo(() => {
    const inClub = players.filter((p) => p.club).length;
    return { total: players.length, inClub, free: players.filter((p) => isFreeAgent(p)).length, verified: players.filter((p) => p.isVerified).length };
  }, [players]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (pos !== "ALL" && p.preferredPosition !== pos) return false;
      if (clubFilter === "CLUB" && !p.club) return false;
      if (clubFilter === "FREE" && !isFreeAgent(p)) return false;
      if (clubFilter === "NOCLUB" && (p.club || isFreeAgent(p))) return false;
      if (!q) return true;
      return [p.fullName, p.username, p.konamiId, p.club?.name, p.deviceModel].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [players, search, pos, clubFilter]);

  return (
    <div className="bg-[#F6F7F9] -mb-px">
      {/* ================= Header ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#0B0C0F] text-white p-6 sm:p-10">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(199,154,59,0.28),transparent_50%),radial-gradient(ellipse_at_0%_100%,rgba(59,130,246,0.18),transparent_45%)]" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
            style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
          <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#C79A3B]">
                <Users className="w-3.5 h-3.5" /> National athlete registry
              </div>
              <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight">
                Players <span className="bg-gradient-to-r from-[#F3D48A] to-[#C79A3B] bg-clip-text text-transparent">of NECOB</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/60 max-w-xl">
                Every registered eFootball athlete in Bangladesh — Konami UIDs, clubs, ratings and career stats.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <HeaderStat icon={Users} label="Players" value={stats.total} />
              <HeaderStat icon={Shield} label="In a club" value={stats.inClub} />
              <HeaderStat icon={UserX} label="Free Agents" value={stats.free} />
              <HeaderStat icon={BadgeCheck} label="Verified" value={stats.verified} />
            </div>
          </div>
        </div>
      </section>

      {/* ================= Filters (sticky) ================= */}
      <div className="md:sticky md:top-16 z-20 mt-4 bg-[#F6F7F9]/90 backdrop-blur border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, username, Konami UID, club or device…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-black placeholder-slate-400 focus:outline-none focus:border-black"
              />
            </div>
            <div className="flex gap-2">
              <div className="inline-flex rounded-xl bg-white border border-slate-200 p-1 shrink-0">
                {([
                  ["ALL", "All"],
                  ["CLUB", "In a club"],
                  ["FREE", "Free Agents"],
                  ["NOCLUB", "No club"],
                ] as const).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setClubFilter(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${clubFilter === v ? "bg-black text-white" : "text-slate-600 hover:text-black"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-black focus:outline-none focus:border-black min-w-0"
                aria-label="Sort players"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    Sort: {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {["ALL", ...PLAYER_POSITIONS].map((p) => (
              <button
                key={p}
                onClick={() => setPos(p)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition-colors border ${
                  pos === p ? "bg-[#C79A3B] border-[#C79A3B] text-black" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                {p === "ALL" ? "All positions" : p}
              </button>
            ))}
            <span className="ml-auto pl-3 text-[11px] font-bold text-slate-500 whitespace-nowrap">{loading ? "Loading…" : `${filtered.length} players`}</span>
          </div>
        </div>
      </div>

      {/* ================= Grid ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-200 p-4 animate-pulse">
                <div className="mx-auto mt-4 w-20 h-20 rounded-full bg-slate-200" />
                <div className="mt-4 h-4 w-2/3 mx-auto rounded bg-slate-200" />
                <div className="mt-2 h-3 w-1/2 mx-auto rounded bg-slate-100" />
                <div className="mt-5 h-12 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-white border border-dashed border-slate-300">
            <Search className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">No players found</p>
            <p className="text-xs text-slate-500">Try another name, UID or position.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filtered.slice(0, shown).map((p) => (
                <PlayerCard key={p.id} p={p} />
              ))}
            </div>
            {shown < filtered.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShown((n) => n + PAGE)}
                  className="px-6 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800"
                >
                  Show more players
                  <span className="ml-2 text-white/50 font-mono text-xs">
                    {shown}/{filtered.length}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function HeaderStat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 min-w-[110px]">
      <Icon className="w-4 h-4 text-[#C79A3B]" />
      <div className="mt-1.5 text-xl sm:text-2xl font-black font-mono">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</div>
    </div>
  );
}

function PlayerCard({ p }: { p: any }) {
  const s = p.stats || {};
  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 text-center shadow-sm hover:shadow-lg hover:border-[#C79A3B]/60 hover:-translate-y-0.5 transition-all">
      {/* Top chips */}
      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-[10px] sm:text-[11px] font-black font-mono">
        <Sparkles className="w-3 h-3" /> {ratingText(p)}
      </span>
      <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-black">{p.preferredPosition}</span>

      {/* Avatar */}
      <Link href={`/players/${p.username}`} className="relative mx-auto mt-5 block w-20 h-20 sm:w-24 sm:h-24">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C79A3B] via-[#f5d58a] to-[#8a6420] p-[3px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.avatar} alt={p.fullName} loading="lazy" className="w-full h-full rounded-full object-cover bg-slate-100 ring-2 ring-white" />
        </span>
        {p.club && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.club.logo} alt={p.club.name} title={p.club.name} loading="lazy" className="absolute -top-1 -right-1 w-8 h-8 rounded-full object-cover bg-white ring-2 ring-white shadow" />
        )}
        {p.shirtNo ? (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black font-mono ring-2 ring-white">#{p.shirtNo}</span>
        ) : null}
      </Link>

      {/* Identity */}
      <Link href={`/players/${p.username}`} className="mt-4 flex items-center justify-center gap-1 min-w-0 text-sm sm:text-base font-black text-slate-950 hover:underline">
        <span className="truncate">{p.fullName}</span>
        {p.isVerified && <BadgeCheck className="w-4 h-4 text-sky-500 shrink-0" aria-label="Verified" />}
      </Link>
      <div className="mt-0.5 flex items-center justify-center gap-1 min-w-0">
        <span className="text-[11px] text-slate-500 font-mono truncate">@{p.username}</span>
        <CopyButton value={p.username} label="Username copied" className="!w-5 !h-5 !border-0 !bg-transparent shrink-0" />
      </div>
      {p.club ? (
        <Link href={`/clubs/${p.club.slug}`} className="mt-1 inline-flex self-center items-center gap-1 max-w-full px-2 py-0.5 rounded-full bg-amber-50 text-[10px] sm:text-[11px] font-bold text-amber-900 hover:bg-amber-100">
          <Shield className="w-3 h-3 shrink-0" /> <span className="truncate">{p.club.name}</span>
        </Link>
      ) : (
        <span className={`mt-1 self-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${isFreeAgent(p) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{noClubLabel(p)}</span>
      )}

      {/* Details */}
      <div className="mt-3 space-y-1 text-[11px] text-slate-600">
        {p.konamiId && (
          <div className="flex items-center justify-center gap-1 min-w-0">
            <span className="hidden sm:inline text-slate-400">UID</span>
            <span className="font-bold font-mono text-slate-800 text-[10px] sm:text-[11px] tracking-tight truncate">{p.konamiId}</span>
            <CopyButton value={p.konamiId} label="UID copied" className="!w-5 !h-5 !border-0 !bg-transparent shrink-0" />
          </div>
        )}
        {p.deviceModel && (
          <div className="flex items-center justify-center gap-1 min-w-0 text-slate-500">
            <Smartphone className="w-3 h-3 shrink-0" /> <span className="truncate">{p.deviceModel}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-auto pt-3">
        <div className="grid grid-cols-3 rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-200 text-center">
          {[
            ["Win %", `${s.winRate || 0}%`, "text-emerald-700"],
            ["Goals", s.goalsScored || 0, "text-slate-950"],
            ["MOTM", p.motmCount || 0, "text-amber-700"],
          ].map(([k, v, c]) => (
            <div key={k as string} className="py-1.5">
              <div className={`text-sm font-black font-mono ${c}`}>{v}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{k}</div>
            </div>
          ))}
        </div>
        {p.form?.length > 0 && (
          <div className="mt-2 flex justify-center gap-1">
            {p.form.slice(-5).map((r: string, i: number) => (
              <span key={i} className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center border ${getFormColor(r)}`}>
                {r}
              </span>
            ))}
          </div>
        )}
        <Link
          href={`/players/${p.username}`}
          className="mt-2.5 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold text-slate-700 bg-slate-100 group-hover:bg-black group-hover:text-white transition-colors"
        >
          View profile <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
