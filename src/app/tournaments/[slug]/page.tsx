import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Trophy, Calendar, Users, ArrowLeft, Shield, Swords, GitFork, Clock, Gamepad2, Ticket } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/utils";
import { JoinButton } from "@/components/ui/JoinButton";
import { DeadlineCountdown } from "@/components/ui/DeadlineCountdown";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  REGISTRATION_OPEN: { label: "Registration open", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  REGISTRATION_CLOSED: { label: "Registration closed", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  ONGOING: { label: "In progress", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  COMPLETED: { label: "Completed", cls: "bg-slate-900 text-white border-slate-900" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await db.getTournamentBySlug(slug);
  return t ? { title: t.name, description: t.description?.slice(0, 160) } : { title: "Tournament not found" };
}

export default async function TournamentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await db.getTournamentBySlug(slug);
  if (!t) notFound();

  const status = STATUS[t.status] || STATUS.DRAFT;
  const fixtures: any[] = t.fixtures || [];
  const participants: any[] = t.participants || [];
  const clubs: any[] = (t as any).clubs || [];
  const isClub = t.participantType === "CLUB";

  // Group fixtures into bracket columns by round, ordered by when each round starts.
  const rounds = new Map<string, any[]>();
  for (const f of fixtures) {
    const key = f.round || "Round";
    if (!rounds.has(key)) rounds.set(key, []);
    rounds.get(key)!.push(f);
  }
  const roundList = [...rounds.entries()].sort((a, b) => +new Date(a[1][0].scheduledDate) - +new Date(b[1][0].scheduledDate));
  const winner = t.winnerPlayerId ? participants.find((p) => p.id === t.winnerPlayerId) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link href="/tournaments" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-black transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>All tournaments</span>
      </Link>

      {/* Hero */}
      <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="relative h-40 sm:h-56 bg-[#0F1012]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.banner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-5 sm:left-8 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.logo} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white shadow" />
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.cls}`}>{status.label}</span>
          </div>
        </div>

        <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.gameCategory} · {t.format.replace(/_/g, " ")}
              {t.season ? ` · ${t.season}` : ""}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight">{t.name}</h1>
            {t.description && <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{t.description}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <Info icon={Calendar} label="Dates" value={t.startDate ? `${formatDate(t.startDate)}${t.endDate ? ` – ${formatDate(t.endDate)}` : ""}` : "TBA"} />
              <Info icon={Trophy} label="Prize pool" value={t.prizePool || "—"} />
              <Info icon={Ticket} label="Entry fee" value={t.entryFee || "Free"} />
              <Info icon={Gamepad2} label="Platform" value={t.platform} />
            </div>
            {winner && (
              <Link href={`/players/${winner.username}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold">
                <Trophy className="w-4 h-4" /> Champion: {winner.fullName}
              </Link>
            )}
          </div>

          <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 h-fit">
            <div className="text-center">
              <div className="text-[11px] text-slate-500 uppercase font-bold">{isClub ? "Clubs registered" : "Players registered"}</div>
              <div className="text-3xl font-black text-black font-mono">
                {t.currentParticipants}
                <span className="text-slate-400 text-xl">/{t.maxParticipants}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden mt-2">
                <div className="h-full bg-black" style={{ width: `${Math.min(100, (t.currentParticipants / Math.max(t.maxParticipants, 1)) * 100)}%` }} />
              </div>
            </div>
            {t.status === "REGISTRATION_OPEN" && t.registrationDeadline && (
              <div className="text-center space-y-1">
                <div className="text-[11px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Registration closes in
                </div>
                <DeadlineCountdown target={t.registrationDeadline} />
                <div className="text-[11px] text-slate-500">
                  {formatDate(t.registrationDeadline)} · {formatTime(t.registrationDeadline)}
                </div>
              </div>
            )}
            <JoinButton
              endpoint={`/api/tournaments/${t.slug}/join`}
              memberIds={t.participantUserIds}
              memberClubIds={isClub ? t.participantClubIds : []}
              allowLeave={!isClub}
              isOpen={t.isRegistrationOpen}
              joinLabel={isClub ? "Register my club" : "Join tournament"}
              leaveLabel="Withdraw from tournament"
              closedLabel={
                t.status === "REGISTRATION_OPEN" && t.currentParticipants >= t.maxParticipants ? "Tournament is full" : STATUS[t.status]?.label || "Registration closed"
              }
            />
          </div>
        </div>
      </div>

      {/* Bracket / rounds */}
      <section className="space-y-4">
        <h2 className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
          <GitFork className="w-4 h-4" /> {t.format.includes("ELIMINATION") ? "Bracket" : "Rounds & fixtures"}
        </h2>
        {roundList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            Fixtures will appear here once the organisers publish the draw.
          </div>
        ) : (
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-5 min-w-max">
              {roundList.map(([round, list]) => (
                <div key={round} className="w-72 shrink-0 space-y-3">
                  <div className="text-xs font-black uppercase tracking-widest text-center pb-2 border-b border-slate-300">{round}</div>
                  {list.map((f) => (
                    <FixtureCard key={f.id} f={f} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Participants */}
        <section className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> {isClub ? `Clubs (${clubs.length})` : `Participants (${participants.length})`}
          </h2>
          {isClub ? (
            clubs.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {clubs.map((c) => (
                  <Link key={c.id} href={`/clubs/${c.slug}`} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-black transition-colors">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.logo} alt="" className="w-9 h-9 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-black truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {c.shortName} · {c.squadCount} players{c.location ? ` · ${c.location}` : ""}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No clubs have registered yet.</p>
            )
          ) : participants.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {participants.map((p) => (
                <Link key={p.id} href={`/players/${p.username}`} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-black transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar} alt="" className="w-9 h-9 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-black truncate">{p.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{p.club?.shortName || "Free agent"} · {p.rating}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No one has joined yet — be the first!</p>
          )}
        </section>

        {/* Rules */}
        <section className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3 h-fit">
          <h2 className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4" /> Rules
          </h2>
          {t.rules ? (
            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{t.rules}</div>
          ) : (
            <p className="text-xs text-slate-600">
              Standard competition rules apply. See the{" "}
              <Link href="/rules" className="font-bold underline">
                rulebook
              </Link>
              .
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
      <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-xs font-bold text-black mt-0.5 truncate">{value}</div>
    </div>
  );
}

function FixtureCard({ f }: { f: any }) {
  const home = f.homePlayer?.fullName || f.homeClub?.name || "TBD";
  const away = f.awayPlayer?.fullName || f.awayClub?.name || "TBD";
  const done = f.status === "FINISHED" && f.result;
  const live = f.status === "LIVE";
  const hs = done ? f.result.homeScore : live ? f.liveScore.home : null;
  const as = done ? f.result.awayScore : live ? f.liveScore.away : null;
  const homeWin = done && (hs > as || (hs === as && (f.result.homePenalties ?? 0) > (f.result.awayPenalties ?? 0)));
  const awayWin = done && !homeWin && hs !== as ? true : done && hs === as && (f.result.awayPenalties ?? 0) > (f.result.homePenalties ?? 0);

  return (
    <Link href={`/matches/${f.id}`} className={`block p-3.5 rounded-2xl bg-white border shadow-sm space-y-2 hover:border-black transition-colors ${live ? "border-rose-300 border-2" : "border-slate-200"}`}>
      <div className="flex items-center justify-between text-[10px] font-bold">
        {live ? <span className="px-2 py-0.5 rounded bg-rose-600 text-white">LIVE {f.minute}</span> : <span className="text-slate-500">{done ? "Full time" : `${formatDate(f.scheduledDate)} · ${formatTime(f.scheduledDate)}`}</span>}
        <Swords className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className={`flex items-center justify-between text-xs font-bold ${homeWin ? "text-black" : done ? "text-slate-500" : "text-black"}`}>
        <span className="truncate">{home}</span>
        <span className="font-mono text-sm">{hs ?? "-"}</span>
      </div>
      <div className={`flex items-center justify-between text-xs font-bold border-t border-slate-100 pt-1.5 ${awayWin ? "text-black" : done ? "text-slate-500" : "text-black"}`}>
        <span className="truncate">{away}</span>
        <span className="font-mono text-sm">{as ?? "-"}</span>
      </div>
      {done && f.result.homePenalties != null && f.result.awayPenalties != null && (
        <div className="text-[10px] text-slate-500 text-center">
          Pens {f.result.homePenalties} - {f.result.awayPenalties}
        </div>
      )}
    </Link>
  );
}
