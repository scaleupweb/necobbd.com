import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Shield,
  Trophy,
  Calendar,
  Smartphone,
  ArrowLeft,
  BadgeCheck,
  Swords,
  Award,
  Activity as ActivityIcon,
  MapPin,
  Facebook,
  Pencil,
  Crown,
  BarChart3,
  User,
  ArrowRightLeft,
  Settings,
  Droplet,
  Cake,
  Flame,
  Target,
  Timer,
  Zap,
  TrendingUp,
  Goal,
  Star,
  Hourglass,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { toMatchLines, snapshot, monthlyLoad, seasons, humanGap, aboutText, MatchLine } from "@/lib/player-insights";
import { LineChart, BarChart, Gauge, Donut } from "@/components/profile/Charts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const p = await db.getPlayerByUsername(decodeURIComponent(username));
  return p ? { title: `${p.fullName} (@${p.username})`, description: p.bio || `${p.fullName}'s player profile, stats and match history` } : { title: "Player not found" };
}

const TABS = [
  ["overview", "Overview", User],
  ["performance", "Performance", TrendingUp],
  ["matches", "Matches", Swords],
  ["achievements", "Trophies", Trophy],
  ["transfers", "Transfers", ArrowRightLeft],
  ["timeline", "Timeline", ActivityIcon],
] as const;

export default async function PlayerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const player = await db.getPlayerByUsername(decodeURIComponent(username));
  if (!player) notFound();

  const userId = player.userId ? String(player.userId) : "";
  const [fixtures, tournaments, events, activity, session, transfers, rankInfo, settings] = await Promise.all([
    db.getFixtures({ playerId: player.id, limit: 500 }),
    userId ? db.getTournamentsForUser(userId) : Promise.resolve([]),
    userId ? db.getEventsForUser(userId) : Promise.resolve([]),
    db.getActivityForUser(userId, player.id, 50),
    getSession(),
    db.getTransferHistoryForPlayer(player.id),
    db.getPlayerRank(player),
    getSiteSettings(),
  ]);
  const isMe = !!session && session.id === userId;
  const clubAccess = isMe && player.club ? await db.getClubAccess(session!.id, player.club.id) : null;
  const club = player.clubId ? await db.getClubById(player.clubId) : null;

  const lines = toMatchLines(fixtures, player.id);
  const snap = snapshot(lines);
  const months = monthlyLoad(lines);
  const bySeason = seasons(lines);
  const form = lines.slice(-28);
  const upcoming = fixtures.filter((f: any) => f.status === "SCHEDULED" || f.status === "LIVE");
  const titles = tournaments.filter((t: any) => t.winnerPlayerId === player.id || (club && t.winnerClubId === club.id));
  const s = player.stats;
  const about = aboutText(player, rankInfo.rank, rankInfo.total, lines, snap, titles.length, settings.brand.siteName);
  const contractDays = player.contract?.daysRemaining || 0;
  const contractPct = contractDays ? Math.min(100, Math.round((contractDays / 365) * 100)) : 0;
  const cover = player.coverImage || (club?.banner && !club.banner.startsWith("/images/placeholders") ? club.banner : "");
  const dob = player.dob ? new Date(player.dob).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "";
  const season = bySeason[0];
  const goalsPerMatch = s.matchesPlayed ? (s.goalsScored / s.matchesPlayed).toFixed(2) : "0";

  return (
    <div className="bg-[#F6F7F9] -mb-px">
      {/* ================= HERO ================= */}
      <header className="relative bg-[#0B0C0F] text-white overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(199,154,59,0.35),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgba(79,70,229,0.35),transparent_50%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0F] via-[#0B0C0F]/70 to-transparent" />
        {player.club && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={player.club.logo} alt="" aria-hidden className="absolute -right-10 -top-10 w-80 h-80 object-cover rounded-full opacity-[0.07] blur-[1px]" />
        )}

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          <div className="flex items-center justify-between">
            <Link href="/players" className="inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" /> All players
            </Link>
            <div className="flex gap-2">
              {clubAccess && (
                <Link href="/dashboard/my-club" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C79A3B] text-black text-xs font-black hover:bg-[#d8ad52]">
                  <Settings className="w-3.5 h-3.5" /> Manage {player.club?.shortName || "club"}
                </Link>
              )}
              {isMe && (
                <Link href="/dashboard?tab=profile" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-bold hover:bg-white/20">
                  <Pencil className="w-3.5 h-3.5" /> Edit profile
                </Link>
              )}
            </div>
          </div>

          <div className="mt-10 sm:mt-14 flex flex-col md:flex-row md:items-end gap-6">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#C79A3B] via-[#f5d58a] to-[#8a6420] p-[3px] rotate-3">
                <div className="w-full h-full rounded-[1.8rem] bg-[#0B0C0F]" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={player.avatar} alt={player.fullName} className="relative w-full h-full rounded-[2rem] object-cover border-4 border-[#0B0C0F] bg-slate-800" />
              {player.club && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.club.logo} alt={player.club.name} title={player.club.name} className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl object-cover border-[3px] border-[#0B0C0F] bg-white" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-black tracking-widest uppercase">{player.preferredPosition}</span>
                {player.shirtNo ? <span className="px-2 py-0.5 rounded-md bg-[#C79A3B] text-black text-[10px] font-black">#{player.shirtNo}</span> : null}
                {player.status !== "ACTIVE" && <span className="px-2 py-0.5 rounded-md bg-rose-600 text-[10px] font-black">{player.status.replace(/_/g, " ")}</span>}
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none flex items-center gap-2">
                {player.fullName}
                {player.isVerified && <BadgeCheck className="w-7 h-7 text-sky-400 shrink-0" aria-label="Verified" />}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
                <span className="font-mono">@{player.username}</span>
                {player.club && (
                  <Link href={`/clubs/${player.club.slug}`} className="inline-flex items-center gap-1 font-bold text-white hover:underline">
                    <Shield className="w-3.5 h-3.5 text-[#C79A3B]" /> {player.club.name}
                  </Link>
                )}
                {player.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {player.location}
                  </span>
                )}
                {player.facebookProfile && (
                  <a href={player.facebookProfile} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 hover:text-white">
                    <Facebook className="w-3.5 h-3.5" /> Facebook
                  </a>
                )}
              </div>
            </div>

            {/* Rank medallion */}
            <div className="shrink-0 self-start md:self-end">
              <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#f5d58a] to-[#8a6420] p-[3px] shadow-[0_0_40px_rgba(199,154,59,0.35)]">
                <div className="w-full h-full rounded-full bg-[#0B0C0F] flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black tracking-[0.2em] text-[#C79A3B]">RANK</span>
                  <span className="text-2xl font-black font-mono leading-none mt-1">{rankInfo.rank ? `#${rankInfo.rank}` : "—"}</span>
                  <span className="text-[9px] text-white/50 mt-1">{rankInfo.rank ? `of ${rankInfo.total}` : "unranked"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Glass stat bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.06] backdrop-blur divide-x divide-white/10">
            {[
              ["Matches", s.matchesPlayed],
              ["Wins", s.wins],
              ["Win rate", `${s.winRate}%`],
              ["Goals", s.goalsScored],
            ].map(([k, v]) => (
              <div key={k} className="px-5 py-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{k}</div>
                <div className="text-2xl sm:text-3xl font-black font-mono">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ================= Sticky pill nav ================= */}
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
          {/* Player ID card */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#111827] to-[#0B0C0F] text-white p-5 shadow-xl">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full border-[18px] border-white/5" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-[0.25em] text-indigo-300">PLAYER ID</span>
              <span className="text-[10px] font-bold text-white/40">{settings.brand.siteName}</span>
            </div>
            <div className="mt-4 font-mono text-lg tracking-widest">{player.konamiId || "—"}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Konami UID</div>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <IdRow icon={Smartphone} label="Device" value={player.deviceModel} />
              <IdRow icon={Target} label="Play style" value={player.playStyle} />
              <IdRow icon={Cake} label="Birthday" value={dob} />
              <IdRow icon={Droplet} label="Blood" value={player.bloodGroup} />
              <IdRow icon={MapPin} label="District" value={player.location} />
              <IdRow icon={Calendar} label="Joined" value={formatDate(player.createdAt)} />
            </div>
          </div>

          {/* Club card */}
          {player.club ? (
            <Link href={`/clubs/${player.club.slug}`} className="block relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm group">
              <div className="h-20 bg-[#0B0C0F] relative overflow-hidden">
                {club?.banner && !club.banner.startsWith("/images/placeholders") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={club.banner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                )}
                <span className="absolute right-4 top-1 text-6xl font-black text-white/15 font-mono">{player.shirtNo ? `#${player.shirtNo}` : ""}</span>
              </div>
              <div className="px-5 pb-5 -mt-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={player.club.logo} alt="" className="relative w-16 h-16 rounded-2xl object-cover border-4 border-white shadow bg-white" />
                <div className="mt-2 text-[10px] font-black tracking-widest text-slate-400">CURRENT CLUB</div>
                <div className="text-lg font-black text-black group-hover:underline">{player.club.name}</div>
                {club?.slogan && <div className="text-xs italic text-slate-500">“{club.slogan}”</div>}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-500">Contract</span>
                    <span className="text-black">{contractDays ? `${contractDays} days left` : "Active"}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${contractDays ? contractPct : 100}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 p-6 text-center">
              <Shield className="w-8 h-8 mx-auto text-slate-300" />
              <div className="mt-2 text-sm font-black text-slate-700">Free agent</div>
              <div className="text-xs text-slate-500">Open to offers from clubs</div>
            </div>
          )}

          {/* Rating gauge */}
          <div className="rounded-3xl bg-[#0B0C0F] text-white p-5">
            <Gauge value={player.rating} min={500} max={1300} label="Rating" />
            <div className="grid grid-cols-2 gap-2 mt-3 text-center">
              <div className="rounded-xl bg-white/5 py-2">
                <div className="text-[10px] text-white/50 font-bold">MARKET VALUE</div>
                <div className="font-black font-mono">{formatCurrency(player.marketValue)}</div>
              </div>
              <div className="rounded-xl bg-white/5 py-2">
                <div className="text-[10px] text-white/50 font-bold">GOALS / MATCH</div>
                <div className="font-black font-mono">{goalsPerMatch}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= MAIN ================= */}
        <main className="lg:col-span-8 space-y-6 min-w-0">
          {/* Overview: key moments */}
          <section id="overview" className="scroll-mt-32">
            <SectionTitle icon={Sparkles} title="Key moments" subtitle="Highlights from official matches" />
            {snap ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Moment color="from-sky-500 to-indigo-600" icon={Calendar} label="Debut" value={formatDate(snap.debut)} />
                <Moment color="from-emerald-500 to-teal-600" icon={Zap} label="Last played" value={formatDate(snap.lastPlayed)} />
                <Moment color="from-amber-500 to-orange-600" icon={Flame} label="Unbeaten run" value={`${snap.unbeaten.len} matches`} sub={snap.unbeaten.len ? `${formatDate(snap.unbeaten.from)} → ${formatDate(snap.unbeaten.to)}` : ""} />
                <Moment color="from-rose-500 to-pink-600" icon={Goal} label="Top scoring game" value={snap.topGoals ? `${snap.topGoals.gf} goals` : "—"} sub={snap.topGoals ? `vs ${snap.topGoals.opponent}` : ""} />
                <Moment color="from-violet-500 to-purple-600" icon={Timer} label="Avg match gap" value={humanGap(snap.avgGapDays)} />
                <Moment color="from-slate-600 to-slate-800" icon={Hourglass} label="Longest break" value={humanGap(snap.maxGapDays)} />
              </div>
            ) : (
              <EmptyState icon={Sparkles} title="Story starts with the first match" text="Debut, streaks and best performances will show up here after the first approved result." />
            )}
          </section>

          {/* Form strip */}
          <section className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={Flame} title="Form" subtitle={form.length ? `Last ${form.length} matches · newest on the right` : "Recent results"} inline />
              {form.length > 0 && (
                <div className="flex gap-1">
                  {form.slice(-5).map((m) => (
                    <span key={m.id} className={`w-6 h-6 rounded-md text-[11px] font-black flex items-center justify-center text-white ${m.result === "W" ? "bg-emerald-500" : m.result === "L" ? "bg-rose-500" : "bg-slate-400"}`}>
                      {m.result}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {form.length ? (
              <div className="flex flex-wrap gap-2.5">
                {form.map((m) => (
                  <FormChip key={m.id} m={m} />
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className="w-9 h-9 rounded-full border-2 border-dashed border-slate-200" />
                ))}
              </div>
            )}
          </section>

          {/* Performance */}
          <section id="performance" className="scroll-mt-32 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
                <SectionTitle icon={Target} title="Results split" subtitle="All official matches" />
                <Donut
                  center={`${s.winRate}%`}
                  sub="win rate"
                  parts={[
                    { label: "Wins", value: s.wins, color: "#22C55E" },
                    { label: "Draws", value: s.draws, color: "#94A3B8" },
                    { label: "Losses", value: s.losses, color: "#F43F5E" },
                  ]}
                />
              </div>

              {/* Scoreboard */}
              <div className="rounded-3xl bg-[#0B0C0F] text-white p-5 sm:p-6 overflow-hidden">
                <SectionTitle icon={BarChart3} title="Scoreboard" subtitle="All-time vs this season" dark />
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-white/40">
                      <th className="text-left font-bold pb-2"></th>
                      <th className="text-right font-bold pb-2">All-time</th>
                      <th className="text-right font-bold pb-2 text-[#C79A3B]">{season?.season || "Season"}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {[
                      ["Played", s.matchesPlayed, season?.matches ?? 0],
                      ["Won", s.wins, season?.wins ?? 0],
                      ["Drawn", s.draws, season?.draws ?? 0],
                      ["Lost", s.losses, season?.losses ?? 0],
                      ["Goals for", s.goalsScored, season?.gf ?? 0],
                      ["Goals against", s.goalsConceded, season?.ga ?? 0],
                      ["Clean sheets", s.cleanSheets, "—"],
                      ["MOTM", player.motmCount, season?.motm ?? 0],
                    ].map(([k, a, b]) => (
                      <tr key={k as string} className="border-t border-white/5">
                        <td className="py-1.5 font-sans text-xs text-white/60">{k}</td>
                        <td className="py-1.5 text-right font-black">{a}</td>
                        <td className="py-1.5 text-right font-black text-[#C79A3B]">{b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {lines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-3xl bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 p-5 sm:p-6">
                  <SectionTitle icon={BarChart3} title="Season trend" subtitle="Matches, wins and goals per season" />
                  <BarChart
                    labels={[...bySeason].reverse().map((x) => x.season)}
                    series={[
                      { name: "Matches", color: "#CBD5E1", values: [...bySeason].reverse().map((x) => x.matches) },
                      { name: "Wins", color: "#22C55E", values: [...bySeason].reverse().map((x) => x.wins) },
                      { name: "Goals", color: "#6366F1", values: [...bySeason].reverse().map((x) => x.gf) },
                    ]}
                  />
                </div>
                <div className="rounded-3xl bg-gradient-to-b from-amber-50 to-white border border-amber-100 p-5 sm:p-6">
                  <SectionTitle icon={TrendingUp} title="Monthly load" subtitle="Activity month by month" />
                  <LineChart
                    labels={months.map((m) => m.label)}
                    series={[
                      { name: "Matches", color: "#6366F1", values: months.map((m) => m.matches) },
                      { name: "Wins", color: "#22C55E", values: months.map((m) => m.wins) },
                      { name: "Goals", color: "#EAB308", values: months.map((m) => m.goals) },
                    ]}
                  />
                </div>
              </div>
            ) : (
              <EmptyState icon={TrendingUp} title="Charts unlock after a few matches" text="Season and monthly trends are drawn from approved results." />
            )}
          </section>

          {/* Matches */}
          <section id="matches" className="scroll-mt-32">
            <SectionTitle icon={Swords} title="Matches" subtitle={`${lines.length} results${upcoming.length ? ` · ${upcoming.length} upcoming` : ""}`} />
            {upcoming.length > 0 && (
              <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcoming.map((f: any) => (
                  <Link key={f.id} href={`/matches/${f.id}`} className={`rounded-2xl p-4 text-white ${f.status === "LIVE" ? "bg-rose-600" : "bg-slate-900"} hover:opacity-95`}>
                    <div className="text-[10px] font-black tracking-widest opacity-70">{f.status === "LIVE" ? "● LIVE NOW" : "UPCOMING"}</div>
                    <div className="font-bold mt-1 truncate">vs {f.homePlayer?.id === player.id ? f.awayPlayer?.fullName || f.awayClub?.name : f.homePlayer?.fullName || f.homeClub?.name}</div>
                    <div className="text-xs opacity-70">{formatDate(f.scheduledDate)} · {f.tournamentName || f.round}</div>
                  </Link>
                ))}
              </div>
            )}
            {lines.length ? (
              <div className="space-y-2">
                {[...lines].reverse().slice(0, 30).map((m) => (
                  <Link key={m.id} href={`/matches/${m.id}`} className="flex items-stretch rounded-2xl bg-white border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                    <span className={`w-1.5 ${m.result === "W" ? "bg-emerald-500" : m.result === "L" ? "bg-rose-500" : "bg-slate-400"}`} />
                    <div className="flex-1 flex items-center gap-3 p-3 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.opponentAvatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-black truncate">
                          vs {m.opponent}
                          {m.motm && <Star className="inline w-3.5 h-3.5 ml-1 text-amber-500 fill-amber-500" />}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{[m.tournament, m.round, formatDate(m.date)].filter(Boolean).join(" · ")}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black font-mono">
                          {m.gf}<span className="text-slate-300">:</span>
                          {m.ga}
                        </div>
                        <div className={`text-[10px] font-black ${m.result === "W" ? "text-emerald-600" : m.result === "L" ? "text-rose-600" : "text-slate-500"}`}>
                          {m.result === "W" ? "WIN" : m.result === "L" ? "LOSS" : "DRAW"}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              !upcoming.length && <EmptyState icon={Swords} title="No official matches yet" text="Join an open tournament to get fixtures." />
            )}
          </section>

          {/* Trophy cabinet */}
          <section id="achievements" className="scroll-mt-32 rounded-3xl overflow-hidden bg-gradient-to-br from-[#2A1D06] via-[#1a1206] to-[#0B0C0F] text-white p-5 sm:p-6">
            <SectionTitle icon={Trophy} title="Trophy cabinet" subtitle="Titles, awards and tournaments" dark />
            <div className="grid grid-cols-3 gap-3">
              {[
                [Crown, titles.length, "Titles"],
                [Award, player.motmCount, "MOTM"],
                [Shield, s.cleanSheets, "Clean sheets"],
              ].map(([Icon, v, l]: any) => (
                <div key={l} className="rounded-2xl bg-white/[0.06] border border-[#C79A3B]/20 p-4 text-center">
                  <Icon className="w-6 h-6 mx-auto text-[#FBBF24]" />
                  <div className="text-3xl font-black font-mono mt-1">{v}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{l}</div>
                </div>
              ))}
            </div>
            {titles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {titles.map((t: any) => (
                  <Link key={t.id} href={`/tournaments/${t.slug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C79A3B] text-black text-xs font-black">
                    <Crown className="w-3.5 h-3.5" /> {t.name}
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-5">
              <div className="text-[10px] font-black tracking-widest text-white/40 mb-2">TOURNAMENTS ({tournaments.length})</div>
              {tournaments.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tournaments.map((t: any) => (
                    <Link key={t.id} href={`/tournaments/${t.slug}`} className="flex items-center gap-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] p-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.logo} alt="" className="w-9 h-9 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{t.name}</div>
                        <div className="text-[10px] text-white/50 truncate">
                          {t.status.replace(/_/g, " ").toLowerCase()}
                          {t.joinedAt ? ` · joined ${formatDate(t.joinedAt)}` : ""}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-white/50">No tournaments yet.</div>
              )}
            </div>
          </section>

          {/* Transfers */}
          <section id="transfers" className="scroll-mt-32">
            <SectionTitle icon={ArrowRightLeft} title="Transfer history" subtitle="Club registrations and moves" />
            {transfers.length ? (
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#C79A3B] to-slate-200" />
                <div className="space-y-3">
                  {transfers.map((t: any, i: number) => (
                    <div key={t.id} className="relative">
                      <span className={`absolute -left-[22px] top-5 w-3.5 h-3.5 rounded-full border-[3px] border-[#F6F7F9] ${i === 0 ? "bg-[#C79A3B]" : "bg-slate-300"}`} />
                      <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 p-3.5">
                        {t.oldClub?.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.oldClub.logo} alt="" className="w-8 h-8 rounded-lg object-cover opacity-60" />
                        ) : (
                          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">FREE</span>
                        )}
                        <ArrowRightLeft className="w-4 h-4 text-slate-300 shrink-0" />
                        {t.newClub?.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.newClub.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <Shield className="w-10 h-10 text-slate-300" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-black truncate">
                            {t.newClub?.slug ? (
                              <Link href={`/clubs/${t.newClub.slug}`} className="hover:underline">
                                {t.newClub.name}
                              </Link>
                            ) : (
                              t.newClub?.name
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatDate(t.date)} · {t.oldClub ? `from ${t.oldClub.name}` : "registered"}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {t.shirtNo && <div className="text-sm font-black font-mono text-[#C79A3B]">#{t.shirtNo}</div>}
                          <div className="text-[10px] font-bold uppercase text-slate-400">{t.fee ? formatCurrency(t.fee) : t.type}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState icon={ArrowRightLeft} title="No transfers recorded" text="Club moves will be listed here." />
            )}
          </section>

          {/* Activity feed */}
          <section id="timeline" className="scroll-mt-32 rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
            <SectionTitle icon={ActivityIcon} title="Activity" subtitle="Everything this player has been up to" />
            {activity.length ? (
              <ul className="space-y-3">
                {activity.map((a: any) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-1 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <ActivityIcon className="w-3.5 h-3.5 text-slate-500" />
                    </span>
                    <div className="min-w-0">
                      {a.targetUrl ? (
                        <Link href={a.targetUrl} className="text-sm font-bold text-black hover:underline">
                          {a.title}
                        </Link>
                      ) : (
                        <div className="text-sm font-bold text-black">{a.title}</div>
                      )}
                      <div className="text-[11px] text-slate-400">
                        {formatRelativeTime(a.createdAt)}
                        {a.description ? ` · ${a.description}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Nothing yet — joining tournaments, results and awards will appear here.</p>
            )}
          </section>

          {/* About */}
          <section className="rounded-3xl bg-white border-l-4 border-[#C79A3B] border-y border-r border-slate-200 p-6 sm:p-8">
            <div className="text-[10px] font-black tracking-[0.25em] text-[#C79A3B]">PROFILE</div>
            <h2 className="text-2xl font-black text-black mt-1">About {player.fullName}</h2>
            {player.bio && <blockquote className="mt-4 text-base text-slate-800 italic border-l-2 border-slate-200 pl-4 whitespace-pre-line">“{player.bio}”</blockquote>}
            <div className="mt-4 space-y-2.5">
              {about.map((para, i) => (
                <p key={i} className={`text-sm text-slate-600 leading-relaxed ${i === 0 ? "first-letter:text-3xl first-letter:font-black first-letter:text-black first-letter:mr-1 first-letter:float-left first-letter:leading-none" : ""}`}>
                  {para}
                </p>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-slate-400">
              Member since {formatDate(player.createdAt)}
              {events.length ? ` · ${events.length} event${events.length === 1 ? "" : "s"} attended` : ""}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, dark, inline }: { icon: any; title: string; subtitle?: string; dark?: boolean; inline?: boolean }) {
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

function Moment({ color, icon: Icon, label, value, sub }: { color: string; icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="relative rounded-2xl bg-white border border-slate-200 p-4 overflow-hidden">
      <span className={`absolute -right-4 -top-4 w-16 h-16 rounded-full bg-gradient-to-br ${color} opacity-15`} />
      <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-base font-black text-black truncate">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 truncate" title={sub}>{sub}</div>}
    </div>
  );
}

function IdRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/40">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="font-bold truncate" title={value}>
        {value || "—"}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
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

function FormChip({ m }: { m: MatchLine }) {
  const ring = m.result === "W" ? "ring-emerald-500" : m.result === "L" ? "ring-rose-500" : "ring-slate-400";
  const bg = m.result === "W" ? "bg-emerald-500" : m.result === "L" ? "bg-rose-500" : "bg-slate-400";
  return (
    <Link href={`/matches/${m.id}`} className="flex flex-col items-center gap-1 group" title={`${m.result} ${m.gf}-${m.ga} vs ${m.opponent} · ${formatDate(m.date)}`}>
      <span className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.opponentAvatar} alt="" className={`w-10 h-10 rounded-full object-cover ring-[3px] ${ring} group-hover:scale-110 transition-transform`} />
        {m.motm && <Star className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
      </span>
      <span className={`px-1.5 rounded text-[10px] font-black text-white ${bg} font-mono`}>
        {m.gf}-{m.ga}
      </span>
    </Link>
  );
}
