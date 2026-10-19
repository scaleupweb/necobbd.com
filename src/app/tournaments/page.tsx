"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Trophy, Calendar, Users, ArrowRight, Coins, Ticket, GitFork, Smartphone, Swords, Flag, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { FitImage } from "@/components/ui/FitImage";

const FORMAT: Record<string, string> = {
  SINGLE_ELIMINATION: "Knockout",
  DOUBLE_ELIMINATION: "Double elimination",
  LEAGUE_ROUND_ROBIN: "League",
  GROUP_AND_KNOCKOUT: "Groups + Knockout",
  SWISS: "Swiss",
  CLUB_BATTLE: "Club battle",
  NATIONAL_TOURNAMENT: "National tournament",
};

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  REGISTRATION_OPEN: { label: "Registration open", cls: "bg-emerald-500/15 border-emerald-400/40 text-emerald-600", dot: "bg-emerald-500" },
  ONGOING: { label: "Live now", cls: "bg-rose-500/10 border-rose-400/40 text-rose-600", dot: "bg-rose-500" },
  REGISTRATION_CLOSED: { label: "Registration closed", cls: "bg-amber-500/10 border-amber-400/40 text-amber-700", dot: "bg-amber-500" },
  UPCOMING: { label: "Coming soon", cls: "bg-sky-500/10 border-sky-400/40 text-sky-700", dot: "bg-sky-500" },
  COMPLETED: { label: "Completed", cls: "bg-slate-100 border-slate-200 text-slate-600", dot: "bg-slate-400" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 border-slate-200 text-slate-500", dot: "bg-slate-300" },
};
const statusOf = (s: string) => STATUS[s] || { label: s.replace(/_/g, " ").toLowerCase(), cls: "bg-slate-100 border-slate-200 text-slate-600", dot: "bg-slate-400" };

const FILTERS = [
  ["all", "All"],
  ["open", "Open"],
  ["live", "Live"],
  ["done", "Completed"],
] as const;
type Filter = (typeof FILTERS)[number][0];
const matchFilter = (t: any, f: Filter) =>
  f === "all" ? true : f === "open" ? t.isRegistrationOpen : f === "live" ? t.status === "ONGOING" : t.status === "COMPLETED";

function StatusPill({ t, dark = false }: { t: any; dark?: boolean }) {
  const s = statusOf(t.status);
  const live = t.status === "REGISTRATION_OPEN" || t.status === "ONGOING";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${dark ? "bg-black/50 backdrop-blur border-white/20 text-white" : s.cls}`}>
      <span className="relative flex w-1.5 h-1.5">
        {live && <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${s.dot}`} />}
        <span className={`relative inline-flex rounded-full w-1.5 h-1.5 ${s.dot}`} />
      </span>
      {s.label}
    </span>
  );
}

function Spots({ t, dark = false }: { t: any; dark?: boolean }) {
  const pct = t.maxParticipants ? Math.min(100, Math.round((t.currentParticipants / t.maxParticipants) * 100)) : 0;
  const left = Math.max(0, t.maxParticipants - t.currentParticipants);
  const unit = t.participantType === "CLUB" ? "clubs" : "players";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className={`inline-flex items-center gap-1.5 ${dark ? "text-white/80" : "text-slate-700"}`}>
          <Users className={`w-3.5 h-3.5 ${dark ? "text-[#F7DC8B]" : "text-[#C79A3B]"}`} /> {t.currentParticipants}/{t.maxParticipants} {unit}
        </span>
        {t.isRegistrationOpen && <span className={dark ? "text-[#F7DC8B]" : "text-[#8a6420]"}>{left ? `${left} spots left` : "Full"}</span>}
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-slate-100"}`}>
        <div className="cd-bar h-full rounded-full bg-gradient-to-r from-[#F7DC8B] via-[#E8B95A] to-[#C79A3B]" style={{ width: `${Math.max(3, pct)}%` }} />
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value, dark = false, gold = false }: { icon: any; label: string; value: string; dark?: boolean; gold?: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-2.5 min-w-0 ${dark ? "bg-white/[0.06] border border-white/10" : "bg-slate-50 border border-slate-100"}`}>
      <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider ${dark ? "text-white/45" : "text-slate-400"}`}>
        <Icon className="w-3 h-3 shrink-0" /> <span className="truncate">{label}</span>
      </div>
      <div className={`mt-0.5 text-sm font-black truncate ${gold ? (dark ? "text-[#F7DC8B]" : "text-[#8a6420]") : dark ? "text-white" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

const when = (t: any) => {
  if (t.isRegistrationOpen && t.registrationDeadline) return { label: "Reg. closes", value: formatDate(t.registrationDeadline) };
  if (t.status === "COMPLETED" && t.endDate) return { label: "Ended", value: formatDate(t.endDate) };
  return { label: "Starts", value: t.startDate ? formatDate(t.startDate) : "TBA" };
};

function Cta({ t, dark = false }: { t: any; dark?: boolean }) {
  const label = t.isRegistrationOpen ? "Join tournament" : t.status === "ONGOING" ? "Fixtures & results" : "View details";
  return (
    <Link
      href={`/tournaments/${t.slug}`}
      className={
        t.isRegistrationOpen
          ? "cd-cta group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-black text-[#0B0C0F]"
          : `group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-black ${dark ? "bg-white text-black hover:bg-zinc-200" : "bg-[#0B0C0F] text-white hover:bg-black"}`
      }
    >
      {t.isRegistrationOpen ? <Ticket className="w-4 h-4" /> : <GitFork className="w-4 h-4" />}
      {label}
      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/** Big dark card for the tournament that matters most right now. */
function Featured({ t }: { t: any }) {
  const w = when(t);
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#08090C] text-white shadow-xl ring-1 ring-black/5 grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div aria-hidden className="absolute -top-32 right-0 w-[420px] h-[420px] rounded-full bg-[#C79A3B]/20 blur-[120px]" />
      <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[400px] overflow-hidden">
        <FitImage src={t.banner} alt={t.name} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-transparent to-[#08090C]/90" />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <StatusPill t={t} dark />
          {t.gameCategory && <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur border border-white/20 text-[10px] font-black uppercase tracking-wider">{t.gameCategory}</span>}
        </div>
      </div>
      <div className="relative p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex items-start gap-3">
          {t.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.logo} alt="" className="w-14 h-14 rounded-2xl object-cover bg-white/10 ring-2 ring-[#C79A3B]/50 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F7DC8B]">Featured tournament</div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-white to-[#F7DC8B] bg-clip-text text-transparent">{t.name}</span>
            </h2>
            {t.description && <p className="mt-1.5 text-sm text-white/60 line-clamp-2">{t.description}</p>}
          </div>
        </div>
        <Spots t={t} dark />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Fact icon={Coins} label="Prize pool" value={t.prizePool || "—"} dark gold />
          <Fact icon={Ticket} label="Entry" value={t.entryFee || "Free"} dark />
          <Fact icon={Flag} label="Format" value={FORMAT[t.format] || "—"} dark />
          <Fact icon={Swords} label="Matches" value={`${t.completedMatches}/${t.totalMatches}`} dark />
          <Fact icon={Calendar} label={w.label} value={w.value} dark />
          <Fact icon={Smartphone} label="Platform" value={t.platform || "—"} dark />
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          <Cta t={t} dark />
          {t.isRegistrationOpen && (
            <Link href={`/tournaments/${t.slug}`} className="inline-flex items-center px-4 py-3 rounded-2xl text-xs font-bold text-white/70 hover:text-white border border-white/15 hover:border-white/40">
              Rules & details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function TournamentCard({ t }: { t: any }) {
  const w = when(t);
  return (
    <div className="group flex flex-col rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#C79A3B]/60 transition-all duration-300">
      <div className="relative h-44 overflow-hidden bg-slate-900">
        <FitImage src={t.banner} alt={t.name} imgClassName="group-hover:scale-[1.03] transition-transform duration-500" />
        <div className="absolute top-3 left-3">
          <StatusPill t={t} dark />
        </div>
        {t.prizePool && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#F7DC8B] to-[#C79A3B] text-[#0B0C0F] text-[10px] font-black">
            <Coins className="w-3 h-3" /> {t.prizePool}
          </span>
        )}
        {t.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.logo} alt="" className="absolute -bottom-6 left-5 w-12 h-12 rounded-2xl object-cover bg-white ring-4 ring-white shadow-md" />
        )}
      </div>
      <div className={`flex-1 flex flex-col gap-4 p-5 ${t.logo ? "pt-8" : ""}`}>
        <div>
          <h3 className="text-base font-black text-slate-950 line-clamp-1 group-hover:underline">{t.name}</h3>
          <div className="mt-0.5 text-[11px] text-slate-500 truncate">
            {[t.gameCategory, FORMAT[t.format]].filter(Boolean).join(" · ")}
          </div>
        </div>
        <Spots t={t} />
        <div className="grid grid-cols-3 gap-2">
          <Fact icon={Ticket} label="Entry" value={t.entryFee || "Free"} />
          <Fact icon={Swords} label="Matches" value={`${t.completedMatches}/${t.totalMatches}`} />
          <Fact icon={Calendar} label={w.label} value={w.value} />
        </div>
        <div className="mt-auto">
          <Cta t={t} />
        </div>
      </div>
    </div>
  );
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((json) => json.success && setTournaments(json.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([k]) => [k, tournaments.filter((t) => matchFilter(t, k)).length])) as Record<Filter, number>, [tournaments]);
  // Featured: the admin's pick, otherwise the first one open for registration or live.
  const featured = useMemo(
    () => tournaments.find((t) => t.isFeatured && t.status !== "COMPLETED") || tournaments.find((t) => t.isRegistrationOpen || t.status === "ONGOING") || null,
    [tournaments]
  );
  const list = tournaments.filter((t) => matchFilter(t, filter) && (filter !== "all" || t.id !== featured?.id));
  const entrants = tournaments.reduce((a, t) => a + (t.currentParticipants || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FFF8E6] via-white to-white border border-amber-100 p-6 sm:p-8">
        <Trophy aria-hidden className="absolute -right-6 -bottom-8 w-48 h-48 text-[#C79A3B]/10 rotate-12" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-black text-[#8a6420] uppercase tracking-[0.25em]">
              <Trophy className="w-4 h-4" /> Tournaments
            </div>
            <h1 className="mt-2 text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-[1.05]">
              Compete for <span className="bg-gradient-to-r from-[#C79A3B] to-[#8a6420] bg-clip-text text-transparent">glory</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl">Register your club, follow the fixtures and see every result in one place.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            {[
              ["Open", counts.open],
              ["Live", counts.live],
              [tournaments.some((t) => t.participantType === "CLUB") ? "Clubs in" : "Entrants", entrants],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-center shadow-sm min-w-[84px]">
                <div className="text-2xl font-black font-mono text-slate-950">{loading ? "–" : v}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-14 text-center">
          <Trophy className="w-10 h-10 mx-auto text-slate-300" />
          <div className="mt-3 text-base font-black text-slate-950">No tournaments yet</div>
          <p className="text-sm text-slate-500">New tournaments will appear here. Check back soon.</p>
        </div>
      ) : (
        <>
          {featured && filter === "all" && <Featured t={featured} />}

          {/* Filters */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-1.5 p-1 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
              {FILTERS.map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${
                    filter === k ? "bg-[#0B0C0F] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {l}
                  <span className={`px-1.5 rounded-md text-[10px] font-black ${filter === k ? "bg-white/15 text-[#F7DC8B]" : "bg-slate-100 text-slate-500"}`}>{counts[k]}</span>
                </button>
              ))}
            </div>
          </div>

          {list.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {list.map((t) => (
                <TournamentCard key={t.id} t={t} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              {filter === "all" ? "That's the only tournament right now — more are on the way." : "No tournaments in this group right now."}
            </div>
          )}
        </>
      )}
    </div>
  );
}
