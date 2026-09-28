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
  Target,
  Award,
  Activity as ActivityIcon,
  MapPin,
  Facebook,
  Pencil,
  Crown,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatCurrency, getFormColor, formatDate, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function ratingTier(r: number) {
  if (r >= 1100) return { label: "Legend", cls: "bg-amber-100 text-amber-900 border-amber-300" };
  if (r >= 950) return { label: "Elite", cls: "bg-violet-100 text-violet-900 border-violet-300" };
  if (r >= 850) return { label: "Pro", cls: "bg-sky-100 text-sky-900 border-sky-300" };
  if (r >= 750) return { label: "Contender", cls: "bg-emerald-100 text-emerald-900 border-emerald-300" };
  return { label: "Rookie", cls: "bg-slate-100 text-slate-800 border-slate-300" };
}

const STATUS_LABEL: Record<string, string> = {
  REGISTRATION_OPEN: "Registration open",
  REGISTRATION_CLOSED: "Starting soon",
  ONGOING: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const p = await db.getPlayerByUsername(username);
  return p ? { title: `${p.fullName} (@${p.username})`, description: p.bio || `${p.fullName}'s player profile` } : { title: "Player not found" };
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const player = await db.getPlayerByUsername(username);
  if (!player) notFound();

  const userId = player.userId ? String(player.userId) : "";
  const [fixtures, tournaments, events, activity, session] = await Promise.all([
    db.getFixtures({ playerId: player.id, limit: 30 }),
    userId ? db.getTournamentsForUser(userId) : Promise.resolve([]),
    userId ? db.getEventsForUser(userId) : Promise.resolve([]),
    db.getActivityForUser(userId, player.id, 30),
    getSession(),
  ]);
  const isMe = session?.id === userId;
  const tier = ratingTier(player.rating);
  const s = player.stats;
  const finished = fixtures.filter((f: any) => f.status === "FINISHED" && f.result);
  const upcoming = fixtures.filter((f: any) => f.status === "SCHEDULED" || f.status === "LIVE");
  const titles = tournaments.filter((t: any) => t.winnerPlayerId === player.id);

  const statTiles = [
    { label: "Matches", value: s.matchesPlayed, sub: `${s.wins}W · ${s.draws}D · ${s.losses}L`, icon: Swords },
    { label: "Win Rate", value: `${s.winRate}%`, sub: `${s.points} league points`, icon: Target },
    { label: "Goals", value: s.goalsScored, sub: s.matchesPlayed ? `${(s.goalsScored / s.matchesPlayed).toFixed(2)} per match` : "—", icon: Trophy },
    { label: "Clean Sheets", value: s.cleanSheets, sub: `${s.goalsConceded} conceded`, icon: Shield },
    { label: "MOTM", value: player.motmCount, sub: "Man of the Match awards", icon: Award },
    { label: "Tournaments", value: tournaments.length, sub: `${events.length} events attended`, icon: Crown },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link href="/players" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-black transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>All players</span>
      </Link>

      {/* Header card */}
      <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="h-32 sm:h-44 bg-[#0F1012] relative overflow-hidden">
          {player.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={player.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(199,154,59,0.35),transparent_55%)]" />
          )}
          {isMe && (
            <Link
              href="/dashboard?tab=profile"
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-black text-xs font-bold hover:bg-white"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit profile
            </Link>
          )}
        </div>

        <div className="px-5 sm:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={player.avatar}
              alt={player.fullName}
              className="relative z-10 -mt-14 sm:-mt-16 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white shadow-lg bg-slate-100 shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-2 lg:pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">{player.fullName}</h1>
                {player.isVerified && <BadgeCheck className="w-6 h-6 text-sky-600" aria-label="Verified player" />}
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tier.cls}`}>{tier.label}</span>
                {player.status !== "ACTIVE" && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">{player.status.replace(/_/g, " ")}</span>
                )}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-mono">
                @{player.username}
                {player.konamiId && (
                  <>
                    {" "}
                    · UID <span className="text-black font-semibold">{player.konamiId}</span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-black" />
                  {player.club ? (
                    <Link href={`/clubs/${player.club.slug}`} className="font-bold text-black hover:underline">
                      {player.club.name}
                    </Link>
                  ) : (
                    "Free agent"
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-black" /> {player.preferredPosition} · {player.playStyle}
                </span>
                {player.deviceModel && (
                  <span className="inline-flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-black" /> {player.deviceModel}
                  </span>
                )}
                {player.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-black" /> {player.location}
                  </span>
                )}
                {player.facebookProfile && (
                  <a href={player.facebookProfile} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 hover:text-black">
                    <Facebook className="w-3.5 h-3.5" /> Facebook
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-black" /> Joined {formatDate(player.createdAt)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:w-80 shrink-0 lg:pt-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-[10px] text-amber-800 uppercase font-bold">Rating</div>
                <div className="text-2xl font-black text-amber-900 font-mono">{player.rating}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-[10px] text-emerald-800 uppercase font-bold">Market Value</div>
                <div className="text-2xl font-black text-emerald-900 font-mono">{formatCurrency(player.marketValue)}</div>
              </div>
              <div className="col-span-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Form</span>
                <div className="flex items-center gap-1.5">
                  {player.form.length ? (
                    player.form.map((r: string, i: number) => (
                      <span key={i} className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center border ${getFormColor(r)}`}>
                        {r}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No matches yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {player.bio && <p className="text-sm text-slate-600 leading-relaxed max-w-3xl mt-5 whitespace-pre-line">{player.bio}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statTiles.map((t) => (
          <div key={t.label} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase">
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </div>
            <div className="text-2xl font-black text-black font-mono">{t.value}</div>
            <div className="text-[11px] text-slate-500 truncate">{t.sub}</div>
          </div>
        ))}
      </div>

      {titles.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {titles.map((t: any) => (
            <Link key={t.id} href={`/tournaments/${t.slug}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              <Trophy className="w-4 h-4" /> Champion · {t.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: tournaments, events, matches */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Tournaments ({tournaments.length})
            </h2>
            {tournaments.length ? (
              <div className="divide-y divide-slate-100">
                {tournaments.map((t: any) => (
                  <Link key={t.id} href={`/tournaments/${t.slug}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.logo} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-black truncate group-hover:underline">{t.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {STATUS_LABEL[t.status] || t.status} · joined {t.joinedAt ? formatDate(t.joinedAt) : "—"}
                      </div>
                    </div>
                    {t.prizePool && <span className="text-[11px] font-bold text-emerald-700 shrink-0">{t.prizePool}</span>}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Hasn&apos;t joined any tournaments yet.</p>
            )}
          </section>

          <section className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <Swords className="w-4 h-4" /> Matches
            </h2>
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Upcoming</div>
                {upcoming.map((f: any) => (
                  <MatchRow key={f.id} f={f} playerId={player.id} />
                ))}
              </div>
            )}
            {finished.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Results</div>
                {finished.map((f: any) => (
                  <MatchRow key={f.id} f={f} playerId={player.id} />
                ))}
              </div>
            ) : (
              !upcoming.length && <p className="text-xs text-slate-500">No matches on record yet.</p>
            )}
          </section>

          {events.length > 0 && (
            <section className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Events ({events.length})
              </h2>
              <div className="divide-y divide-slate-100">
                {events.map((e: any) => (
                  <Link key={e.id} href={`/events#${e.slug}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 group">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-black truncate group-hover:underline">{e.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{e.venue || "Online"}</div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 shrink-0">{formatDate(e.eventDate)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: activity timeline */}
        <section className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 h-fit">
          <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
            <ActivityIcon className="w-4 h-4" /> Activity
          </h2>
          {activity.length ? (
            <ol className="relative border-l border-slate-200 ml-2 space-y-4">
              {activity.map((a: any) => (
                <li key={a.id} className="ml-4">
                  <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-black border-2 border-white" />
                  <div className="text-[11px] text-slate-400 font-medium">{formatRelativeTime(a.createdAt)}</div>
                  {a.targetUrl ? (
                    <Link href={a.targetUrl} className="text-xs sm:text-sm font-bold text-black hover:underline">
                      {a.title}
                    </Link>
                  ) : (
                    <div className="text-xs sm:text-sm font-bold text-black">{a.title}</div>
                  )}
                  {a.description && <div className="text-[11px] text-slate-500">{a.description}</div>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-slate-500">No activity yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function MatchRow({ f, playerId }: { f: any; playerId: string }) {
  const isHome = f.homePlayer?.id === playerId;
  const opponent = isHome ? f.awayPlayer?.fullName || f.awayClub?.name : f.homePlayer?.fullName || f.homeClub?.name;
  let badge = { t: f.status === "LIVE" ? "LIVE" : "VS", c: f.status === "LIVE" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700" };
  let score = "";
  if (f.result && f.status === "FINISHED") {
    const mine = isHome ? f.result.homeScore : f.result.awayScore;
    const theirs = isHome ? f.result.awayScore : f.result.homeScore;
    score = `${mine} - ${theirs}`;
    badge = mine > theirs ? { t: "W", c: "bg-emerald-100 text-emerald-800" } : mine < theirs ? { t: "L", c: "bg-rose-100 text-rose-800" } : { t: "D", c: "bg-amber-100 text-amber-800" };
  }
  return (
    <Link href={`/matches/${f.id}`} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-black transition-colors">
      <span className={`w-9 h-9 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${badge.c}`}>{badge.t}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-black truncate">vs {opponent || "TBD"}</div>
        <div className="text-[11px] text-slate-500 truncate">
          {[f.tournamentName, f.round].filter(Boolean).join(" · ")} · {formatDate(f.scheduledDate)}
        </div>
      </div>
      {score && <span className="text-sm font-black font-mono text-black shrink-0">{score}</span>}
    </Link>
  );
}
