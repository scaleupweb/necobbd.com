"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Shield, Users, MapPin, Search, GraduationCap, ArrowUpRight, Building2 } from "lucide-react";
import { getFormColor } from "@/lib/utils";
import { FitImage } from "@/components/ui/FitImage";

const SORTS = [
  { value: "squad", label: "Squad size" },
  { value: "points", label: "League points" },
  { value: "name", label: "Name A–Z" },
];

const hasBanner = (b?: string) => !!b && !b.startsWith("/images/placeholders");

export default function ClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("squad");
  const [academyOnly, setAcademyOnly] = useState(false);

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((json) => json.success && setClubs(json.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const cities = new Set(clubs.map((c) => String(c.location || "").split(",")[0].trim().toLowerCase()).filter(Boolean));
    return {
      clubs: clubs.length,
      players: clubs.reduce((a, c) => a + (c.squadCount || 0), 0),
      cities: cities.size,
      academies: clubs.filter((c) => c.isAcademy).length,
    };
  }, [clubs]);

  const maxSquad = useMemo(() => Math.max(1, ...clubs.map((c) => c.squadCount || 0)), [clubs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = clubs.filter((c) => {
      if (academyOnly && !c.isAcademy) return false;
      if (!q) return true;
      return [c.name, c.shortName, c.location].some((v) => String(v || "").toLowerCase().includes(q));
    });
    return [...list].sort((a, b) =>
      sortBy === "name" ? a.name.localeCompare(b.name) : sortBy === "points" ? (b.points || 0) - (a.points || 0) : (b.squadCount || 0) - (a.squadCount || 0)
    );
  }, [clubs, search, sortBy, academyOnly]);

  return (
    <div className="bg-[#F6F7F9] -mb-px">
      {/* ================= Header ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#0B0C0F] text-white p-6 sm:p-10">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(199,154,59,0.28),transparent_50%),radial-gradient(ellipse_at_0%_100%,rgba(16,185,129,0.18),transparent_45%)]" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
            style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
          <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#C79A3B]">
                <Shield className="w-3.5 h-3.5" /> National club roster
              </div>
              <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight">
                Clubs <span className="bg-gradient-to-r from-[#6EE7B7] to-[#C79A3B] bg-clip-text text-transparent">of NECOB</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/60 max-w-xl">Registered eFootball clubs from across Bangladesh — their squads, cities and records.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <HeaderStat icon={Shield} label="Clubs" value={stats.clubs} />
              <HeaderStat icon={Users} label="Club players" value={stats.players} />
              <HeaderStat icon={Building2} label="Cities" value={stats.cities} />
              <HeaderStat icon={GraduationCap} label="Academies" value={stats.academies} />
            </div>
          </div>
        </div>
      </section>

      {/* ================= Filters ================= */}
      <div className="md:sticky md:top-16 z-20 mt-4 bg-[#F6F7F9]/90 backdrop-blur border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search club, tag or city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-black placeholder-slate-400 focus:outline-none focus:border-black"
            />
          </div>
          <div className="flex gap-2">
            <div className="inline-flex rounded-xl bg-white border border-slate-200 p-1 shrink-0">
              {([
                [false, "All clubs"],
                [true, "Academies"],
              ] as const).map(([v, l]) => (
                <button
                  key={l}
                  onClick={() => setAcademyOnly(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${academyOnly === v ? "bg-black text-white" : "text-slate-600 hover:text-black"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort clubs"
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-black focus:outline-none focus:border-black min-w-0"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
            <span className="hidden lg:flex items-center pl-2 text-[11px] font-bold text-slate-500 whitespace-nowrap">{loading ? "Loading…" : `${filtered.length} clubs`}</span>
          </div>
        </div>
      </div>

      {/* ================= Grid ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-white border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-24 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-3 w-1/3 rounded bg-slate-100" />
                  <div className="h-12 rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-white border border-dashed border-slate-300">
            <Search className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">No clubs found</p>
            <p className="text-xs text-slate-500">Try another name, tag or city.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <ClubCard key={c.id} c={c} maxSquad={maxSquad} />
            ))}
          </div>
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

function ClubCard({ c, maxSquad }: { c: any; maxSquad: number }) {
  return (
    <Link
      href={`/clubs/${c.slug}`}
      className="group flex flex-col rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-[#C79A3B]/60 hover:-translate-y-0.5 transition-all"
    >
      {/* Banner */}
      <div className="relative h-24 sm:h-28 bg-[#0B0C0F] overflow-hidden">
        {hasBanner(c.banner) ? (
          <FitImage src={c.banner} className="opacity-90" />
        ) : (
          <>
            {/* The crest itself, blurred, tints the banner with the club's colours */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.logo} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-150 blur-2xl opacity-60" />
            <span aria-hidden className="absolute right-3 -bottom-3 text-6xl font-black leading-none text-white/10 select-none">{c.shortName}</span>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-black/55 backdrop-blur text-white text-[10px] font-black tracking-widest">{c.shortName}</span>
          {c.isAcademy && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
              <GraduationCap className="w-3 h-3" /> Academy
            </span>
          )}
        </div>
        <ArrowUpRight className="absolute top-3 right-3 w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
      </div>

      {/* Identity */}
      <div className="relative px-5 -mt-8 flex items-end gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.logo} alt={c.name} loading="lazy" className="w-16 h-16 rounded-2xl object-cover bg-white ring-4 ring-white shadow-md shrink-0" />
      </div>
      <div className="px-5 pt-2">
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950 truncate group-hover:underline">{c.name}</div>
          {c.location && (
            <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
              <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{c.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-5 pt-4 mt-auto space-y-3">
        <div className="grid grid-cols-3 rounded-2xl bg-slate-50 border border-slate-100 divide-x divide-slate-200 text-center">
          {[
            ["Squad", c.squadCount || 0, "text-slate-950"],
            ["Points", c.points || 0, "text-[#B0852A]"],
            ["Trophies", c.trophiesCount || 0, "text-amber-700"],
          ].map(([k, v, cls]) => (
            <div key={k as string} className="py-2">
              <div className={`text-lg font-black font-mono ${cls}`}>{v}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{k}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Squad size</span>
            <span>{c.squadCount || 0} players</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#C79A3B]" style={{ width: `${Math.round(((c.squadCount || 0) / maxSquad) * 100)}%` }} />
          </div>
        </div>
        {c.form?.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Form</span>
            {c.form.slice(-5).map((r: string, i: number) => (
              <span key={i} className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center border ${getFormColor(r)}`}>
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
