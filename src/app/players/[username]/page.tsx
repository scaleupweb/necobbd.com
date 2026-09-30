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
  Hash,
  Flame,
  Target,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { toMatchLines, snapshot, monthlyLoad, seasons, humanGap, aboutText, MatchLine } from "@/lib/player-insights";
import { LineChart, BarChart } from "@/components/profile/Charts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const p = await db.getPlayerByUsername(decodeURIComponent(username));
  return p ? { title: `${p.fullName} (@${p.username})`, description: p.bio || `${p.fullName}'s player profile, stats and match history` } : { title: "Player not found" };
}

const TABS = [
  ["overview", "Overview", User],
  ["statistics", "Statistics", BarChart3],
  ["matches", "Matches", Swords],
  ["achievements", "Achievements", Trophy],
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
  const cover = player.coverImage || (club?.banner && !club.banner.startsWith("/images/placeholders") ? club.banner : "");
  const dob = player.dob ? new Date(player.dob).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Link href="/players" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-black">
        <ArrowLeft className="w-4 h-4" /> All players
      </Link>

      {/* ===== Header ===== */}
      <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="relative h-40 sm:h-56 bg-[#0F1012] overflow-hidden">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(199,154,59,0.4),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(99,102,241,0.25),transparent_50%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur text-white font-black text-lg sm:text-2xl font-mono border border-white/20">
            {rankInfo.rank ? `#${rankInfo.rank}` : "Unranked"}
          </div>
          {isMe && (
            <div className="absolute top-3 right-3 flex gap-2">
              <Link href="/dashboard?tab=profile" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-black text-xs font-bold hover:bg-white">
                <Pencil className="w-3.5 h-3.5" /> Edit profile
              </Link>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-8 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative -mt-14 sm:-mt-16 shrink-0 w-28 h-28 sm:w-32 sm:h-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={player.avatar} alt={player.fullName} className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg bg-slate-100" />
              {player.club && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.club.logo} alt={player.club.name} title={player.club.name} className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full object-cover border-2 border-white shadow bg-white" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">{player.fullName}</h1>
                {player.isVerified && <BadgeCheck className="w-6 h-6 text-sky-600" aria-label="Verified" />}
                {player.status !== "ACTIVE" && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">{player.status.replace(/_/g, " ")}</span>}
              </div>
              <div className="text-xs sm:text-sm text-slate-600">
                {s.matchesPlayed} matches · {s.wins} wins · {s.winRate}% win rate · {s.goalsScored} goals
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2">
                <span>@{player.username}</span>
                {player.club && (
                  <>
                    <span>·</span>
                    <Link href={`/clubs/${player.club.slug}`} className="font-bold text-black hover:underline">
                      {player.club.name}
                    </Link>
                  </>
                )}
                {player.location && (
                  <>
                    <span>·</span>
                    <span>{player.location}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:pb-1">
              {clubAccess && (
                <Link href="/dashboard/my-club" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800">
                  <Settings className="w-3.5 h-3.5" /> Manage {player.club?.shortName || "club"}
                </Link>
              )}
              {player.facebookProfile && (
                <a href={player.facebookProfile} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#1877F2] text-white" aria-label="Facebook">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <nav className="border-t border-slate-100 px-3 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(([id, label, Icon]) => (
            <a key={id} href={`#${id}`} className="inline-flex items-center gap-1.5 px-3 py-3 text-xs font-bold text-slate-600 hover:text-black whitespace-nowrap border-b-2 border-transparent hover:border-black">
              <Icon className="w-3.5 h-3.5" /> {label}
            </a>
          ))}
        </nav>
      </div>

      {/* ===== Overview ===== */}
      <section id="overview" className="scroll-mt-24 space-y-6">
        <Card title="Associated Teams" subtitle="Club the player is registered with">
          {player.club ? (
            <div className="flex flex-wrap gap-3">
              <Link href={`/clubs/${player.club.slug}`} className="flex items-center gap-3 p-3 pr-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 hover:border-indigo-300 min-w-[240px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={player.club.logo} alt="" className="w-11 h-11 rounded-full object-cover border border-white shadow" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-indigo-900 truncate">{player.club.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {player.shirtNo ? `#${player.shirtNo} · ` : ""}
                    {contractDays ? (
                      <>
                        Contract left <strong className="text-black">{contractDays} days</strong>
                      </>
                    ) : (
                      "Club player"
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Free agent — not registered with a club.</p>
          )}
        </Card>

        <Card title="Player Snapshot" subtitle="Quick summary of official performance">
          {snap ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Tile label="Debut" value={formatDate(snap.debut)} />
              <Tile label="Last played" value={formatDate(snap.lastPlayed)} />
              <Tile label="Avg match gap" value={humanGap(snap.avgGapDays)} />
              <Tile label="Max match gap" value={humanGap(snap.maxGapDays)} />
              <Tile
                label="Longest unbeaten streak"
                value={snap.unbeaten.len ? `${snap.unbeaten.len} matches` : "—"}
                sub={snap.unbeaten.len ? `${formatDate(snap.unbeaten.from)} — ${formatDate(snap.unbeaten.to)}` : ""}
              />
              <Tile
                label="Most goals in a match"
                value={snap.topGoals ? `${snap.topGoals.gf} goals` : "—"}
                sub={snap.topGoals ? `vs ${snap.topGoals.opponent} (${snap.topGoals.gf}-${snap.topGoals.ga})` : ""}
              />
            </div>
          ) : (
            <p className="text-xs text-slate-500">No official matches recorded yet.</p>
          )}
        </Card>

        {lines.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Season Performance" subtitle="Matches, wins and goals per season">
              <BarChart
                labels={[...bySeason].reverse().map((x) => x.season)}
                series={[
                  { name: "Matches", color: "#CBD5E1", values: [...bySeason].reverse().map((x) => x.matches) },
                  { name: "Wins", color: "#22C55E", values: [...bySeason].reverse().map((x) => x.wins) },
                  { name: "Goals for", color: "#6366F1", values: [...bySeason].reverse().map((x) => x.gf) },
                ]}
              />
            </Card>
            <Card title="Monthly Match Load" subtitle="Official matches, wins and goals per month">
              <LineChart
                labels={months.map((m) => m.label)}
                series={[
                  { name: "Matches", color: "#6366F1", values: months.map((m) => m.matches) },
                  { name: "Wins", color: "#22C55E", values: months.map((m) => m.wins) },
                  { name: "Goals", color: "#EAB308", values: months.map((m) => m.goals) },
                ]}
              />
            </Card>
          </div>
        )}

        <Card title="Form" subtitle={form.length ? `Last ${form.length} official matches — oldest left, newest right` : "Recent results"}>
          {form.length ? (
            <div className="flex flex-wrap gap-2">
              {form.map((m) => (
                <FormChip key={m.id} m={m} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No results yet.</p>
          )}
        </Card>
      </section>

      {/* ===== Statistics ===== */}
      <section id="statistics" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="All-time Statistics" subtitle={rankInfo.rank ? `Overall rank #${rankInfo.rank} of ${rankInfo.total} ranked players` : "Unranked until the first official match"}>
          <StatGrid
            items={[
              ["M", s.matchesPlayed],
              ["W", s.wins],
              ["D", s.draws],
              ["L", s.losses],
              ["Win%", `${s.winRate}%`],
              ["GF", s.goalsScored],
              ["GA", s.goalsConceded],
              ["CS", s.cleanSheets],
              ["MOTM", player.motmCount],
              ["Rating", player.rating],
            ]}
          />
        </Card>
        <Card title={`Season ${bySeason[0]?.season || new Date().getFullYear()}`} subtitle="Current season record">
          {bySeason[0] ? (
            <StatGrid
              items={[
                ["M", bySeason[0].matches],
                ["W", bySeason[0].wins],
                ["D", bySeason[0].draws],
                ["L", bySeason[0].losses],
                ["Win%", `${Math.round((bySeason[0].wins / Math.max(bySeason[0].matches, 1)) * 1000) / 10}%`],
                ["GF", bySeason[0].gf],
                ["GA", bySeason[0].ga],
                ["MOTM", bySeason[0].motm],
              ]}
            />
          ) : (
            <p className="text-xs text-slate-500">No matches this season.</p>
          )}
        </Card>
        <Card title="Market & Rating" subtitle="Updated after every approved result">
          <div className="grid grid-cols-2 gap-3">
            <Tile label="Rating" value={String(player.rating)} />
            <Tile label="Market value" value={formatCurrency(player.marketValue)} />
            <Tile label="Tournaments" value={String(tournaments.length)} />
            <Tile label="Events" value={String(events.length)} />
          </div>
        </Card>

        <div className="lg:col-span-3">
          <Card title="Personal Info" subtitle="Public player details">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Tile icon={Smartphone} label="Device" value={player.deviceModel || "—"} />
              <Tile icon={Hash} label="Konami UID" value={player.konamiId || "—"} />
              <Tile icon={Target} label="Position / style" value={`${player.preferredPosition} · ${player.playStyle}`} />
              <Tile icon={Cake} label="Birthday" value={dob || "—"} />
              <Tile icon={Droplet} label="Blood group" value={player.bloodGroup || "—"} />
              <Tile icon={MapPin} label="District" value={player.location || "—"} />
            </div>
          </Card>
        </div>
      </section>

      {/* ===== Matches ===== */}
      <section id="matches" className="scroll-mt-24">
        <Card title="Official Matches" subtitle={`${lines.length} results${upcoming.length ? ` · ${upcoming.length} upcoming` : ""}`}>
          {upcoming.length > 0 && (
            <div className="space-y-2 mb-4">
              {upcoming.map((f: any) => (
                <Link key={f.id} href={`/matches/${f.id}`} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 hover:border-black text-xs">
                  <span className="font-bold">
                    vs {f.homePlayer?.id === player.id ? f.awayPlayer?.fullName || f.awayClub?.name : f.homePlayer?.fullName || f.homeClub?.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold ${f.status === "LIVE" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                    {f.status === "LIVE" ? "LIVE" : formatDate(f.scheduledDate)}
                  </span>
                </Link>
              ))}
            </div>
          )}
          {lines.length ? (
            <div className="divide-y divide-slate-100">
              {[...lines].reverse().slice(0, 50).map((m) => (
                <Link key={m.id} href={`/matches/${m.id}`} className="flex items-center gap-3 py-2.5 hover:bg-slate-50 px-1 rounded-lg">
                  <ResultBadge r={m.result} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.opponentAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-black truncate">
                      vs {m.opponent} {m.motm && <span className="text-amber-600">★ MOTM</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{[m.tournament, m.round, formatDate(m.date)].filter(Boolean).join(" · ")}</div>
                  </div>
                  <span className="text-sm font-black font-mono">
                    {m.gf} - {m.ga}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            !upcoming.length && <p className="text-xs text-slate-500">No official matches yet.</p>
          )}
        </Card>
      </section>

      {/* ===== Achievements ===== */}
      <section id="achievements" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Achievements Summary" subtitle="Titles and awards">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Big value={titles.length} label="Champions" />
            <Big value={player.motmCount} label="MOTM awards" />
            <Big value={s.cleanSheets} label="Clean sheets" />
          </div>
          {titles.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4">
              {titles.map((t: any) => (
                <Link key={t.id} href={`/tournaments/${t.slug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                  <Crown className="w-3.5 h-3.5" /> {t.name}
                </Link>
              ))}
            </div>
          )}
        </Card>
        <Card title="Tournaments" subtitle={`${tournaments.length} joined (as player or with the club)`}>
          {tournaments.length ? (
            <div className="divide-y divide-slate-100">
              {tournaments.map((t: any) => (
                <Link key={t.id} href={`/tournaments/${t.slug}`} className="flex items-center gap-3 py-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.logo} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-black truncate">{t.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {t.status.replace(/_/g, " ").toLowerCase()}
                      {t.joinedAt ? ` · joined ${formatDate(t.joinedAt)}` : ""}
                    </div>
                  </div>
                  <Trophy className="w-4 h-4 text-slate-300" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No tournaments yet.</p>
          )}
        </Card>
      </section>

      {/* ===== Transfers ===== */}
      <section id="transfers" className="scroll-mt-24">
        <Card title="Transfer History" subtitle="Club registrations and moves">
          {transfers.length ? (
            <ol className="relative border-l-2 border-slate-200 ml-3 space-y-5">
              {transfers.map((t: any, i: number) => (
                <li key={t.id} className="ml-5">
                  <span className={`absolute -left-[7px] mt-3 w-3 h-3 rounded-full border-2 border-white ${i === 0 ? "bg-rose-600" : "bg-slate-300"}`} />
                  <div className="flex items-center gap-3">
                    {t.newClub?.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.newClub.logo} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <Shield className="w-9 h-9 text-slate-300" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-black truncate">
                        {t.newClub?.slug ? (
                          <Link href={`/clubs/${t.newClub.slug}`} className="hover:underline">
                            {t.newClub.name}
                          </Link>
                        ) : (
                          t.newClub?.name
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatDate(t.date)}
                        {t.oldClub ? ` · from ${t.oldClub.name}` : " · registered"}
                        {t.fee ? ` · ${formatCurrency(t.fee)}` : ` · ${t.type}`}
                      </div>
                    </div>
                    {t.shirtNo && <span className="text-xs font-black text-amber-600 font-mono">#{t.shirtNo}</span>}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-slate-500">No transfers recorded.</p>
          )}
        </Card>
      </section>

      {/* ===== Timeline ===== */}
      <section id="timeline" className="scroll-mt-24">
        <Card title="Timeline" subtitle="Latest activity">
          {activity.length ? (
            <ol className="relative border-l border-slate-200 ml-2 space-y-4">
              {activity.map((a: any) => (
                <li key={a.id} className="ml-4">
                  <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-black border-2 border-white" />
                  <div className="text-[11px] text-slate-400">{formatRelativeTime(a.createdAt)}</div>
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
        </Card>
      </section>

      {/* ===== About ===== */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-3">
        <h2 className="text-lg font-black text-black text-center">About {player.fullName}</h2>
        {player.bio && <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{player.bio}</p>}
        {about.map((para, i) => (
          <p key={i} className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {para}
          </p>
        ))}
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Member since {formatDate(player.createdAt)}
          {events.length ? ` · ${events.length} event${events.length === 1 ? "" : "s"} attended` : ""}
        </p>
      </section>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 h-full">
      <div>
        <h2 className="text-sm font-black text-black">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Tile({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon?: any }) {
  return (
    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-0">
      <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div className="text-sm font-bold text-black truncate" title={value}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-slate-500 truncate" title={sub}>{sub}</div>}
    </div>
  );
}

function StatGrid({ items }: { items: [string, string | number][] }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
      {items.map(([k, v]) => (
        <div key={k} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <div className="text-[9px] font-bold text-slate-500 uppercase">{k}</div>
          <div className="text-sm font-black text-black font-mono">{v}</div>
        </div>
      ))}
    </div>
  );
}

function Big({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="text-3xl font-black text-indigo-700 font-mono">{value}</div>
      <div className="text-[11px] font-bold text-slate-500">{label}</div>
    </div>
  );
}

function ResultBadge({ r }: { r: "W" | "D" | "L" }) {
  const c = r === "W" ? "bg-emerald-100 text-emerald-800" : r === "L" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800";
  return <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${c}`}>{r}</span>;
}

function FormChip({ m }: { m: MatchLine }) {
  const ring = m.result === "W" ? "ring-emerald-500" : m.result === "L" ? "ring-rose-500" : "ring-slate-400";
  const bg = m.result === "W" ? "bg-emerald-500" : m.result === "L" ? "bg-rose-500" : "bg-slate-400";
  return (
    <Link href={`/matches/${m.id}`} className="flex flex-col items-center gap-0.5 group" title={`${m.result} ${m.gf}-${m.ga} vs ${m.opponent} · ${formatDate(m.date)}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.opponentAvatar} alt="" className={`w-9 h-9 rounded-full object-cover ring-2 ${ring} group-hover:scale-110 transition-transform`} />
      <span className={`px-1.5 rounded-full text-[9px] font-black text-white ${bg} font-mono`}>
        {m.gf}-{m.ga}
      </span>
      {m.motm && <Flame className="w-3 h-3 text-amber-500 -mt-0.5" />}
    </Link>
  );
}
