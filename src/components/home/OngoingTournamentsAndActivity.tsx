import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trophy, ChevronRight, Shield, Target, Crown, Swords, Users, Activity, ArrowRightLeft, UserPlus, Newspaper, Flag, CalendarDays, Coins } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { formatRelativeTime } from "@/lib/utils";
import type { HomepageData } from "@/lib/homepage";

const BADGES: Record<string, { icon: any; cls: string }> = {
  "shield-green": { icon: Shield, cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  "circle-teal": { icon: Target, cls: "bg-teal-50 text-teal-600 border-teal-200" },
  "trophy-slate": { icon: Crown, cls: "bg-slate-100 text-slate-700 border-slate-200" },
  default: { icon: Swords, cls: "bg-violet-50 text-violet-600 border-violet-200" },
};

// What kind of activity each feed item is, shown as a small icon on the avatar.
const KINDS: Record<string, { icon: any; cls: string; label: string }> = {
  TRANSFER: { icon: ArrowRightLeft, cls: "bg-violet-600", label: "Transfer" },
  PLAYER_REGISTER: { icon: UserPlus, cls: "bg-emerald-500", label: "New player" },
  TOURNAMENT_JOIN: { icon: Trophy, cls: "bg-[#C79A3B]", label: "Tournament" },
  TOURNAMENT_STATUS: { icon: Flag, cls: "bg-[#C79A3B]", label: "Tournament" },
  TOURNAMENT_CREATED: { icon: Trophy, cls: "bg-[#C79A3B]", label: "Tournament" },
  NEWS: { icon: Newspaper, cls: "bg-sky-500", label: "News" },
};
const KIND_DEFAULT = { icon: Activity, cls: "bg-slate-500", label: "Update" };

const fmtDay = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");

export function OngoingTournamentsAndActivity({
  tournamentsTitle,
  activityTitle,
  showTournaments,
  showActivity,
  featured,
  tournaments,
  activities,
}: {
  tournamentsTitle: string;
  activityTitle: string;
  showTournaments: boolean;
  showActivity: boolean;
  featured: HomepageData["featuredTournament"];
  tournaments: HomepageData["tournamentsList"];
  activities: HomepageData["activities"];
}) {
  const showT = showTournaments && !!featured;
  const showA = showActivity && activities.length > 0;
  if (!showT && !showA) return null;

  const spotsPct = featured && featured.maxParticipants ? Math.min(100, Math.round((featured.participants / featured.maxParticipants) * 100)) : 0;

  return (
    <section className="w-full py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {showT && featured && (
            <div className={`${showA ? "lg:col-span-7" : "lg:col-span-12"} flex flex-col`}>
              <SectionHeader icon={Trophy} title={tournamentsTitle} subtitle="Competitions running now" href="/tournaments" accent="bg-[#C79A3B] text-black" />

              <div className="flex-1 flex flex-col gap-3">
                {/* Featured tournament */}
                <div className="relative flex-1 overflow-hidden rounded-3xl bg-[#08090C] text-white shadow-sm ring-1 ring-black/5 flex flex-col md:flex-row">
                  <div aria-hidden className="absolute -top-28 -left-20 w-80 h-80 rounded-full bg-[#C79A3B]/25 blur-[100px]" />

                  {/* Banner (its own area, so its text never collides with ours) */}
                  <div className="relative md:order-2 md:w-[46%] shrink-0 aspect-[16/9] md:aspect-auto md:min-h-[320px]">
                    <Image src={featured.image || "/images/trophy-gold.jpg"} alt="" fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#08090C] via-[#08090C]/20 to-transparent" />
                  </div>

                  {/* Info */}
                  <div className="relative md:order-1 flex-1 min-w-0 p-5 sm:p-6 flex flex-col gap-4">
                    <div className="space-y-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          featured.isRegistrationOpen ? "bg-emerald-500/15 border border-emerald-400/40 text-emerald-300" : "bg-[#C79A3B]/15 border border-[#C79A3B]/40 text-[#F7DC8B]"
                        }`}
                      >
                        <span className="relative flex w-1.5 h-1.5">
                          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${featured.isRegistrationOpen ? "bg-emerald-400" : "bg-[#F7DC8B]"}`} />
                          <span className={`relative inline-flex rounded-full w-1.5 h-1.5 ${featured.isRegistrationOpen ? "bg-emerald-400" : "bg-[#F7DC8B]"}`} />
                        </span>
                        {featured.season}
                      </span>
                      <h3 className="text-2xl sm:text-[28px] font-black leading-[1.1] tracking-tight">
                        <span className="bg-gradient-to-r from-white to-[#F7DC8B] bg-clip-text text-transparent">{featured.name}</span>
                      </h3>
                    </div>

                    {/* Spots */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1.5 text-white/80">
                          <Users className="w-3.5 h-3.5 text-[#F7DC8B]" /> {featured.participants}/{featured.maxParticipants} {featured.unit}
                        </span>
                        <span className="text-[#F7DC8B]">
                          {Math.max(0, featured.maxParticipants - featured.participants)} spots left
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="cd-bar h-full rounded-full bg-gradient-to-r from-[#F7DC8B] via-[#E8B95A] to-[#C79A3B]" style={{ width: `${Math.max(3, spotsPct)}%` }} />
                      </div>
                    </div>

                    {/* Facts */}
                    <div className="grid grid-cols-3 gap-2">
                      <Fact icon={Swords} label="Matches" value={`${featured.playedMatches}/${featured.totalMatches}`} />
                      <Fact icon={Coins} label="Prize pool" value={featured.prizePool || "—"} gold />
                      <Fact
                        icon={CalendarDays}
                        label={featured.isRegistrationOpen && featured.registrationDeadline ? "Reg. closes" : "Starts"}
                        value={fmtDay(featured.isRegistrationOpen && featured.registrationDeadline ? featured.registrationDeadline : featured.startDate) || "TBA"}
                      />
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <Link href={`/tournaments/${featured.slug}`} className="cd-cta group inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-[#0B0C0F]">
                        {featured.isRegistrationOpen ? "Join Tournament" : "View Tournament"}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                      {featured.isRegistrationOpen && (
                        <Link href={`/tournaments/${featured.slug}`} className="inline-flex items-center px-4 py-2.5 rounded-2xl text-xs font-bold text-white/70 hover:text-white border border-white/15 hover:border-white/40">
                          Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Other tournaments */}
                {tournaments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {tournaments.map((t) => {
                      const b = BADGES[t.badgeType || ""] || BADGES.default;
                      const Icon = b.icon;
                      return (
                        <Link
                          key={t.slug}
                          href={`/tournaments/${t.slug}`}
                          className="group bg-white border border-slate-200 hover:border-[#C79A3B]/60 rounded-2xl p-3 flex items-center gap-3 transition-all shadow-sm hover:shadow-md"
                        >
                          <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${b.cls}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-[#111111] truncate">{t.name}</span>
                            <span className="block text-[11px] text-slate-500 truncate">{t.subtitle}</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {showA && (
            <div className={`${showT ? "lg:col-span-5" : "lg:col-span-12"} flex flex-col`}>
              <SectionHeader icon={Activity} title={activityTitle} subtitle="Live from the community" href="/activity" accent="bg-sky-500 text-white" />
              <div className="relative flex-1 flex flex-col rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-sky-50/70 to-transparent">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Latest updates</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-black text-rose-600">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-rose-500" />
                    </span>
                    LIVE
                  </span>
                </div>

                <ol className="relative flex-1 px-5 py-2">
                  {/* timeline line */}
                  <span aria-hidden className="absolute left-[39px] top-4 bottom-4 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />
                  {activities.map((act) => {
                    const k = KINDS[act.type] || KIND_DEFAULT;
                    const KIcon = k.icon;
                    const body = (
                      <>
                        <span className="relative shrink-0">
                          <span className="relative block w-10 h-10 rounded-full overflow-hidden bg-slate-100 ring-2 ring-white shadow-sm">
                            <Image src={act.avatar} alt="" fill sizes="40px" className="object-cover" />
                          </span>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full ring-2 ring-white flex items-center justify-center text-white ${k.cls}`}>
                            <KIcon className="w-2.5 h-2.5" />
                          </span>
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13px] font-bold text-[#111111] leading-snug line-clamp-2 group-hover:underline">{act.text}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                            <span className="font-bold text-slate-600 shrink-0">{k.label}</span>
                            {act.detail && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="truncate">{act.detail}</span>
                              </>
                            )}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold text-slate-400 whitespace-nowrap pt-0.5">{formatRelativeTime(act.createdAt)}</span>
                      </>
                    );
                    return (
                      <li key={act.id}>
                        {act.href ? (
                          <Link href={act.href} className="group relative flex items-start gap-3 py-2.5 -mx-2 px-2 rounded-xl hover:bg-slate-50 transition-colors">
                            {body}
                          </Link>
                        ) : (
                          <div className="relative flex items-start gap-3 py-2.5">{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>

                <Link href="/activity" className="flex items-center justify-center gap-1 px-5 py-3 border-t border-slate-100 text-xs font-black text-slate-700 hover:text-black hover:bg-slate-50">
                  See all activity <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Fact({ icon: Icon, label, value, gold = false }: { icon: any; label: string; value: string; gold?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] border border-white/10 px-2.5 py-2 min-w-0">
      <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-white/45">
        <Icon className="w-3 h-3" /> <span className="truncate">{label}</span>
      </div>
      <div className={`mt-0.5 text-sm font-black font-mono truncate ${gold ? "text-[#F7DC8B]" : "text-white"}`}>{value}</div>
    </div>
  );
}
