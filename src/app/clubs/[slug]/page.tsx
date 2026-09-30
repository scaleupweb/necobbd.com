import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Trophy,
  Users,
  MapPin,
  Calendar,
  ArrowLeft,
  Facebook,
  Settings,
  Swords,
  Crown,
  ArrowRightLeft,
  Flame,
  BarChart3,
  Target,
  Sparkles,
  GraduationCap,
  UserCog,
  Star,
  Info,
  BadgeCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Donut, Gauge } from "@/components/profile/Charts";
import { FitImage } from "@/components/ui/FitImage";
import { CopyButton } from "@/components/ui/CopyButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await db.getClubBySlug(slug);
  return c ? { title: `${c.name} (${c.shortName})`, description: c.slogan || c.description || `${c.name} squad, fixtures and history` } : { title: "Club not found" };
}

const TABS = [
  ["overview", "Overview", Info],
  ["squad", "Squad", Users],
  ["fixtures", "Fixtures", Swords],
  ["tournaments", "Tournaments", Trophy],
  ["transfers", "Transfers", ArrowRightLeft],
] as const;

type ClubMatch = { id: string; date: string; gf: number; ga: number; result: "W" | "D" | "L"; opponent: string; opponentLogo: string; tournament?: string; round?: string };

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await db.getClubBySlug(slug);
  if (!club || (club.status !== "ACTIVE" && club.status !== "PENDING")) notFound();

  const [extras, fixtures, session] = await Promise.all([db.getClubProfileExtras(club.id), db.getFixtures({ clubId: club.id, limit: 200 }), getSession()]);
  const access = session ? await db.getClubAccess(session.id, club.id) : null;

  const results: ClubMatch[] = fixtures
    .filter((f: any) => f.status === "FINISHED" && f.result?.status === "APPROVED")
    .map((f: any) => {
      const home = f.homeClub?.id === club.id;
      const gf = home ? f.result.homeScore : f.result.awayScore;
      const ga = home ? f.result.awayScore : f.result.homeScore;
      const opp = home ? f.awayClub : f.homeClub;
      return {
        id: f.id,
        date: f.scheduledDate,
        gf,
        ga,
        result: (gf > ga ? "W" : gf < ga ? "L" : "D") as ClubMatch["result"],
        opponent: opp?.name || "Unknown",
        opponentLogo: opp?.logo || "/images/placeholders/club.svg",
        tournament: f.tournamentName,
        round: f.round,
      };
    })
    .sort((a: ClubMatch, b: ClubMatch) => +new Date(b.date) - +new Date(a.date));
  const upcoming = fixtures.filter((f: any) => f.status === "SCHEDULED" || f.status === "LIVE").reverse();
  const st = club.stats;
  const squad = [...club.squad].sort((a: any, b: any) => (a.shirtNo || 999) - (b.shirtNo || 999) || b.rating - a.rating);
  const topRated = [...club.squad].sort((a: any, b: any) => b.rating - a.rating).slice(0, 3);
  const cover = club.banner && !club.banner.startsWith("/images/placeholders") ? club.banner : "";
  const titles = extras?.tournaments.filter((t) => t.won) || [];
  const avgRating = squad.length ? Math.round(squad.reduce((a: number, p: any) => a + p.rating, 0) / squad.length) : 0;
  const rank = extras?.rank;

  return (
    <div className="bg-[#F6F7F9] -mb-px">
      {/* ================= HERO (cover + centred crest) ================= */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
          {/* Cover — shown in full, no dimming */}
          <div className="relative h-44 sm:h-64 lg:h-80 overflow-hidden sm:rounded-b-3xl bg-slate-200">
            {cover ? (
              <FitImage src={cover} />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#064E3B_0%,#0B0C0F_45%,#8a6420_85%,#C79A3B_100%)]">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "22px 22px" }}
                />
                <span aria-hidden className="absolute right-4 sm:right-8 bottom-0 text-[6rem] sm:text-[10rem] font-black leading-none text-white/10 select-none">
                  {club.shortName}
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 top-0 p-3 sm:p-4 flex items-center justify-between">
              <Link href="/clubs" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur text-xs font-bold text-white hover:bg-black/60">
                <ArrowLeft className="w-3.5 h-3.5" /> All clubs
              </Link>
            </div>
          </div>

          <div className="px-4 sm:px-0 pb-6">
            {/* Crest overlapping the cover */}
            <div className="relative mx-auto -mt-20 sm:-mt-24 w-36 h-36 sm:w-44 sm:h-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={club.logo} alt={club.name} className="w-full h-full rounded-[2rem] object-cover ring-[5px] ring-white bg-white shadow-lg" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#C79A3B] text-black text-[10px] font-black tracking-widest ring-4 ring-white">
                {club.shortName}
              </span>
            </div>

            {/* Identity */}
            <div className="mt-5 text-center space-y-2.5">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950">{club.name}</h1>
              {club.slogan && <p className="text-sm sm:text-base italic text-slate-500">“{club.slogan.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, "")}”</p>}

              <div className="flex flex-wrap items-center justify-center gap-2">
                {club.isAcademy && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                    <GraduationCap className="w-3 h-3" /> Academy
                  </span>
                )}
                {club.status === "PENDING" && <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">Pending approval</span>}
                {club.location && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                    <MapPin className="w-3 h-3" /> {club.location}
                  </span>
                )}
                {club.foundedDate && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                    <Calendar className="w-3 h-3" /> Founded {formatDate(club.foundedDate)}
                  </span>
                )}
                {club.facebookPage && (
                  <a href={club.facebookPage} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[11px] font-bold text-blue-700 hover:bg-blue-100">
                    <Facebook className="w-3 h-3" /> Facebook
                  </a>
                )}
              </div>

              {access && (
                <div className="flex justify-center pt-1">
                  <Link href="/dashboard/my-club" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C79A3B] text-black text-xs font-bold hover:bg-[#d8ad52]">
                    <Settings className="w-3.5 h-3.5" /> Manage club
                  </Link>
                </div>
              )}
            </div>

            {/* Stat strip */}
            <div className="mt-6 max-w-3xl mx-auto grid grid-cols-5 rounded-2xl border border-slate-200 bg-slate-50/60 divide-x divide-slate-200">
              {[
                ["Rank", rank?.rank ? `#${rank.rank}` : "—"],
                ["Squad", club.squadCount],
                ["Matches", st.matches],
                ["Wins", st.wins],
                ["Points", club.points],
              ].map(([k, v]) => (
                <div key={k} className="px-1 sm:px-3 py-3 sm:py-3.5 text-center min-w-0">
                  <div className={`text-lg sm:text-2xl font-black font-mono ${k === "Rank" ? "text-[#B0852A]" : "text-slate-950"}`}>{v}</div>
                  <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide sm:tracking-widest text-slate-500 mt-0.5 truncate">{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-16 z-20 bg-[#F6F7F9]/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1.5 overflow-x-auto no-scrollbar py-2.5">
          {TABS.map(([id, label, Icon]) => (
            <a key={id} href={`#${id}`} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-black hover:text-white hover:border-black whitespace-nowrap transition-colors">
              <Icon className="w-3.5 h-3.5" /> {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= SIDEBAR ================= */}
        <aside className="lg:col-span-4 space-y-6 self-start">
          {/* Leadership */}
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#064E3B] via-[#0F172A] to-[#0B0C0F] text-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-[0.25em] text-emerald-300">LEADERSHIP</span>
              <UserCog className="w-4 h-4 text-white/40" />
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Manager", extras?.manager, false],
                ["President", extras?.president, true],
                ["Captain", extras?.captain, true],
                ["Vice captain", extras?.viceCaptain, true],
              ].map(([role, person, isPlayer]: any) => (
                <div key={role} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={person?.avatar || "/images/placeholders/avatar.svg"} alt="" className="w-10 h-10 rounded-xl object-cover bg-white/10" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-white/40">{role}</div>
                    {person ? (
                      isPlayer ? (
                        <Link href={`/players/${person.username}`} className="text-sm font-bold hover:underline truncate block">
                          {person.fullName}
                        </Link>
                      ) : (
                        <div className="text-sm font-bold truncate">{person.fullName}</div>
                      )
                    ) : (
                      <div className="text-sm text-white/40">Not set</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {extras && extras.staff.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Moderators</div>
                <div className="flex flex-wrap gap-1.5">
                  {extras.staff.map((s: any) => (
                    <Link key={s.username} href={`/players/${s.username}`} title={`${s.fullName} · ${s.access === "full_control" ? "full control" : "info only"}`} className="inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-semibold">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      {s.fullName.split(" ")[0]}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Squad strength */}
          <div className="rounded-3xl bg-[#0B0C0F] text-white p-5">
            <Gauge value={avgRating} min={500} max={1300} label="Avg squad rating" color="#10B981" />
            <div className="grid grid-cols-2 gap-2 mt-3 text-center">
              <div className="rounded-xl bg-white/5 py-2">
                <div className="text-[10px] text-white/50 font-bold">CLUB VALUE</div>
                <div className="font-black font-mono">{formatCurrency(club.marketValue)}</div>
              </div>
              <div className="rounded-xl bg-white/5 py-2">
                <div className="text-[10px] text-white/50 font-bold">TROPHIES</div>
                <div className="font-black font-mono">{(club.trophiesCount || 0) + titles.length}</div>
              </div>
            </div>
          </div>

          {/* Top rated */}
          {topRated.length > 0 && (
            <div className="rounded-3xl bg-white border border-slate-200 p-5">
              <div className="text-[10px] font-black tracking-widest text-slate-400 mb-3">TOP RATED</div>
              <div className="space-y-2.5">
                {topRated.map((p: any, i: number) => (
                  <Link key={p.id} href={`/players/${p.username}`} className="flex items-center gap-3 group">
                    <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${i === 0 ? "bg-[#C79A3B] text-black" : "bg-slate-100 text-slate-600"}`}>{i + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    <span className="flex-1 text-sm font-bold text-black truncate group-hover:underline">{p.fullName}</span>
                    <span className="text-xs font-black font-mono text-slate-600">{p.rating}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ================= MAIN ================= */}
        <main className="lg:col-span-8 space-y-6 min-w-0">
          {/* Overview */}
          <section id="overview" className="scroll-mt-32 space-y-6">
            {club.description && (
              <div className="rounded-3xl bg-white border-l-4 border-[#10B981] border-y border-r border-slate-200 p-6">
                <div className="text-[10px] font-black tracking-[0.25em] text-emerald-600">ABOUT THE CLUB</div>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">{club.description}</p>
              </div>
            )}

            <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <Title icon={Flame} title="Form" subtitle={results.length ? "Latest club results · newest first" : "Club match results"} inline />
                {results.length > 0 && (
                  <div className="flex gap-1">
                    {results.slice(0, 5).map((m) => (
                      <span key={m.id} className={`w-6 h-6 rounded-md text-[11px] font-black flex items-center justify-center text-white ${m.result === "W" ? "bg-emerald-500" : m.result === "L" ? "bg-rose-500" : "bg-slate-400"}`}>
                        {m.result}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {results.length ? (
                <div className="flex flex-wrap gap-2.5">
                  {results.slice(0, 20).map((m) => (
                    <Link key={m.id} href={`/matches/${m.id}`} className="flex flex-col items-center gap-1" title={`${m.result} ${m.gf}-${m.ga} vs ${m.opponent}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.opponentLogo} alt="" className={`w-10 h-10 rounded-xl object-cover ring-[3px] ${m.result === "W" ? "ring-emerald-500" : m.result === "L" ? "ring-rose-500" : "ring-slate-400"}`} />
                      <span className="text-[10px] font-black font-mono">
                        {m.gf}-{m.ga}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span key={i} className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-200" />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6">
                <Title icon={Target} title="Results split" subtitle="Club matches" />
                <Donut
                  center={`${st.winRate}%`}
                  sub="win rate"
                  parts={[
                    { label: "Wins", value: st.wins, color: "#22C55E" },
                    { label: "Draws", value: st.draws, color: "#94A3B8" },
                    { label: "Losses", value: st.losses, color: "#F43F5E" },
                  ]}
                />
              </div>
              <div className="rounded-3xl bg-[#0B0C0F] text-white p-5 sm:p-6">
                <Title icon={BarChart3} title="League table line" subtitle="Official club record" dark />
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    ["P", st.matches],
                    ["W", st.wins],
                    ["D", st.draws],
                    ["L", st.losses],
                    ["GF", st.goalsScored],
                    ["GA", st.goalsConceded],
                    ["GD", st.goalsScored - st.goalsConceded],
                    ["PTS", club.points],
                  ].map(([k, v]) => (
                    <div key={k as string} className={`rounded-xl py-2.5 ${k === "PTS" ? "bg-[#C79A3B] text-black" : "bg-white/5"}`}>
                      <div className={`text-[9px] font-black ${k === "PTS" ? "text-black/60" : "text-white/40"}`}>{k}</div>
                      <div className="text-lg font-black font-mono">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Squad */}
          <section id="squad" className="scroll-mt-32">
            <Title icon={Users} title="Squad" subtitle={`${squad.length} registered player${squad.length === 1 ? "" : "s"}`} />
            {squad.length ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {squad.map((p: any) => {
                  const isCaptain = extras?.captain?.username === p.username;
                  return (
                    <div
                      key={p.id}
                      className="relative rounded-2xl border border-amber-200/70 bg-gradient-to-b from-amber-50/70 via-white to-white p-3 sm:p-4 text-center shadow-sm hover:shadow-md hover:border-amber-300 transition-all"
                    >
                      {/* Rating + position */}
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-[10px] sm:text-[11px] font-black font-mono">
                        <Sparkles className="w-3 h-3" /> {p.rating}
                      </span>
                      <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-black">{p.preferredPosition}</span>

                      {/* Avatar */}
                      <Link href={`/players/${p.username}`} className="relative mx-auto mt-5 block w-20 h-20 sm:w-24 sm:h-24">
                        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C79A3B] via-[#f5d58a] to-[#8a6420] p-[3px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.avatar} alt={p.fullName} className="w-full h-full rounded-full object-cover bg-slate-100 ring-2 ring-white" />
                        </span>
                        {p.shirtNo ? (
                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-black font-mono ring-2 ring-white">#{p.shirtNo}</span>
                        ) : null}
                        {isCaptain && (
                          <span className="absolute top-0 -right-1 w-6 h-6 rounded-full bg-[#C79A3B] text-black text-[10px] font-black flex items-center justify-center ring-2 ring-white" title="Captain">
                            C
                          </span>
                        )}
                      </Link>

                      {/* Name */}
                      <Link href={`/players/${p.username}`} className="mt-4 flex items-center justify-center gap-1 text-sm sm:text-base font-black text-slate-950 hover:underline">
                        <span className="truncate">{p.fullName}</span>
                        {p.isVerified && <BadgeCheck className="w-4 h-4 text-sky-500 shrink-0" aria-label="Verified" />}
                      </Link>

                      {/* Username + copy */}
                      <div className="mt-0.5 flex items-center justify-center gap-1.5 min-w-0">
                        <span className="text-[11px] sm:text-xs text-slate-500 font-mono truncate">@{p.username}</span>
                        <CopyButton value={p.username} label="Username copied" className="!w-6 !h-6 shrink-0" />
                      </div>

                      {/* Details */}
                      <div className="mt-2.5 space-y-1 text-[11px] sm:text-xs text-slate-600">
                        {p.konamiId && (
                          <div className="flex items-center justify-center gap-1 min-w-0">
                            <span className="text-slate-400">UID:</span>
                            <span className="font-bold font-mono text-slate-800 break-all leading-tight">{p.konamiId}</span>
                            <CopyButton value={p.konamiId} label="UID copied" className="!w-5 !h-5 !rounded-md !border-0 !bg-transparent shrink-0" />
                          </div>
                        )}
                        {p.deviceModel && (
                          <div className="truncate">
                            <span className="text-slate-400">Device:</span> <span className="font-bold text-slate-800">{p.deviceModel}</span>
                          </div>
                        )}
                        <div className="font-mono text-slate-500">
                          M {p.stats.matchesPlayed} <span className="text-slate-300">|</span> W {p.stats.wins} <span className="text-slate-300">|</span> GF {p.stats.goalsScored}
                        </div>
                      </div>

                      {p.facebookProfile && (
                        <a
                          href={p.facebookProfile}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="mt-2.5 inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          aria-label={`${p.fullName} on Facebook`}
                        >
                          <Facebook className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty icon={Users} title="No players yet" text="Players who join this club will be listed here." />
            )}
          </section>

          {/* Fixtures */}
          <section id="fixtures" className="scroll-mt-32">
            <Title icon={Swords} title="Fixtures & results" subtitle={`${results.length} results${upcoming.length ? ` · ${upcoming.length} upcoming` : ""}`} />
            {upcoming.length > 0 && (
              <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcoming.map((f: any) => {
                  const home = f.homeClub?.id === club.id;
                  const opp = home ? f.awayClub?.name || f.awayPlayer?.fullName : f.homeClub?.name || f.homePlayer?.fullName;
                  return (
                    <Link key={f.id} href={`/matches/${f.id}`} className={`rounded-2xl p-4 text-white ${f.status === "LIVE" ? "bg-rose-600" : "bg-slate-900"}`}>
                      <div className="text-[10px] font-black tracking-widest opacity-70">{f.status === "LIVE" ? "● LIVE NOW" : "UPCOMING"}</div>
                      <div className="font-bold mt-1 truncate">vs {opp}</div>
                      <div className="text-xs opacity-70">{formatDate(f.scheduledDate)} · {f.tournamentName || f.round}</div>
                    </Link>
                  );
                })}
              </div>
            )}
            {results.length ? (
              <div className="space-y-2">
                {results.slice(0, 30).map((m) => (
                  <Link key={m.id} href={`/matches/${m.id}`} className="flex items-stretch rounded-2xl bg-white border border-slate-200 overflow-hidden hover:shadow-md">
                    <span className={`w-1.5 ${m.result === "W" ? "bg-emerald-500" : m.result === "L" ? "bg-rose-500" : "bg-slate-400"}`} />
                    <div className="flex-1 flex items-center gap-3 p-3 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.opponentLogo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-black truncate">vs {m.opponent}</div>
                        <div className="text-[11px] text-slate-500 truncate">{[m.tournament, m.round, formatDate(m.date)].filter(Boolean).join(" · ")}</div>
                      </div>
                      <div className="text-lg font-black font-mono">
                        {m.gf}
                        <span className="text-slate-300">:</span>
                        {m.ga}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              !upcoming.length && <Empty icon={Swords} title="No club matches yet" text="Official club fixtures and results will appear here." />
            )}
          </section>

          {/* Tournaments */}
          <section id="tournaments" className="scroll-mt-32 rounded-3xl bg-gradient-to-br from-[#2A1D06] via-[#1a1206] to-[#0B0C0F] text-white p-5 sm:p-6">
            <Title icon={Trophy} title="Tournaments & titles" subtitle="Competitions the club has entered" dark />
            {titles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {titles.map((t) => (
                  <Link key={t.id} href={`/tournaments/${t.slug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C79A3B] text-black text-xs font-black">
                    <Crown className="w-3.5 h-3.5" /> {t.name}
                  </Link>
                ))}
              </div>
            )}
            {extras && extras.tournaments.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {extras.tournaments.map((t) => (
                  <Link key={t.id} href={`/tournaments/${t.slug}`} className="flex items-center gap-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate">{t.name}</div>
                      <div className="text-[10px] text-white/50">
                        {t.status.replace(/_/g, " ").toLowerCase()}
                        {t.joinedAt ? ` · entered ${formatDate(t.joinedAt)}` : ""}
                      </div>
                    </div>
                    {t.won && <Star className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-xs text-white/50 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Not entered in any tournament yet.
              </div>
            )}
          </section>

          {/* Transfers */}
          <section id="transfers" className="scroll-mt-32">
            <Title icon={ArrowRightLeft} title="Transfers" subtitle="Players joining and leaving" />
            {extras && extras.transfers.length ? (
              <div className="rounded-3xl bg-white border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {extras.transfers.slice(0, 40).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`w-12 text-center text-[10px] font-black rounded-md py-1 ${t.direction === "IN" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {t.direction === "IN" ? "↓ IN" : "↑ OUT"}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      {t.username ? (
                        <Link href={`/players/${t.username}`} className="text-sm font-bold text-black hover:underline truncate block">
                          {t.playerName}
                        </Link>
                      ) : (
                        <div className="text-sm font-bold text-black truncate">{t.playerName}</div>
                      )}
                      <div className="text-[11px] text-slate-500 truncate">
                        {t.direction === "IN" ? `from ${t.otherClub || "Free agent"}` : `to ${t.otherClub}`} · {formatDate(t.date)}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold uppercase text-slate-400">{t.fee ? formatCurrency(t.fee) : t.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon={ArrowRightLeft} title="No transfers recorded" text="Signings and departures will be listed here." />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function Title({ icon: Icon, title, subtitle, dark, inline }: { icon: any; title: string; subtitle?: string; dark?: boolean; inline?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${inline ? "" : "mb-4"}`}>
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? "bg-white/10 text-[#FBBF24]" : "bg-black text-white"}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <h2 className={`text-sm font-black ${dark ? "text-white" : "text-black"}`}>{title}</h2>
        {subtitle && <p className={`text-[11px] ${dark ? "text-white/50" : "text-slate-500"}`}>{subtitle}</p>}
      </div>
    </div>
  );
}

function Empty({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-8 text-center">
      <span className="w-12 h-12 rounded-2xl bg-slate-100 inline-flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-400" />
      </span>
      <div className="mt-3 text-sm font-black text-slate-800">{title}</div>
      <div className="text-xs text-slate-500 mt-1">{text}</div>
    </div>
  );
}
