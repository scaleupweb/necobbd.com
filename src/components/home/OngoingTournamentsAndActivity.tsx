import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trophy, ChevronRight, Shield, Target, Crown, Swords, Users } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { HomepageData } from "@/lib/homepage";

function TournamentBadge({ badgeType }: { badgeType?: string }) {
  switch (badgeType) {
    case "shield-green":
      return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0D2218] border border-[#10B981]/30 flex items-center justify-center text-[#34D399] shrink-0 shadow-inner">
          <Shield className="w-4.5 h-4.5 fill-[#34D399]/20" />
        </div>
      );
    case "circle-teal":
      return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#082226] border border-[#14B8A6]/30 flex items-center justify-center text-[#2DD4BF] shrink-0 shadow-inner">
          <Target className="w-4.5 h-4.5" />
        </div>
      );
    case "trophy-slate":
      return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1C1F24] border border-white/15 flex items-center justify-center text-white shrink-0 shadow-inner">
          <Crown className="w-4.5 h-4.5" />
        </div>
      );
    default:
      return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1D122C] border border-[#A855F7]/30 flex items-center justify-center text-[#C084FC] shrink-0 shadow-inner">
          <Swords className="w-4.5 h-4.5" />
        </div>
      );
  }
}

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

  return (
    <section className="w-full py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {showT && featured && (
            <div className={`${showA ? "lg:col-span-7" : "lg:col-span-12"} flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-base sm:text-lg font-bold text-[#111111]">{tournamentsTitle}</h2>
                <Link href="/tournaments" className="inline-flex items-center space-x-1 text-xs font-semibold text-[#111111] hover:text-[#C79A3B] transition-colors">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className={`grid grid-cols-1 ${tournaments.length ? "md:grid-cols-2" : ""} gap-3.5 flex-1 items-stretch`}>
                <div className="relative overflow-hidden rounded-2xl bg-[#0F1012] text-white p-5 sm:p-6 flex flex-col justify-between shadow-sm border border-white/10 min-h-[340px]">
                  <div className="absolute right-0 bottom-0 top-0 w-[55%] pointer-events-none overflow-hidden">
                    <Image src={featured.image || "/images/trophy-gold.jpg"} alt="" fill sizes="400px" className="object-cover object-right opacity-90 mix-blend-lighten" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0F1012] via-[#0F1012]/80 to-transparent"></div>
                  </div>

                  <div className="relative z-10 space-y-1 max-w-[85%]">
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">{featured.name}</h3>
                    {featured.season && <p className="text-xs text-zinc-400 font-medium">{featured.season}</p>}
                  </div>

                  <div className="relative z-10 space-y-2.5 my-4 max-w-[90%]">
                    <div className="text-xs sm:text-sm font-bold text-white">
                      {featured.playedMatches} / {featured.totalMatches} matches
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/10">
                        <div className="h-full bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#FDE047] rounded-full" style={{ width: `${featured.progressPercent}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-zinc-300 font-mono">{featured.progressPercent}%</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px] sm:text-xs text-zinc-300 font-medium pt-1">
                      <Users className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
                      <span className="truncate">
                        {featured.participants}/{featured.maxParticipants} {featured.unit}{featured.prizePool ? ` • ${featured.prizePool}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 pt-1">
                    <Link
                      href={`/tournaments/${featured.slug}`}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all shadow-md active:scale-95"
                    >
                      <span>{featured.isRegistrationOpen ? "Join Tournament" : "View Tournament"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-black" />
                    </Link>
                  </div>
                </div>

                {tournaments.length > 0 && (
                  <div className="flex flex-col gap-2.5 h-full">
                    {tournaments.map((t) => (
                      <Link
                        key={t.slug}
                        href={`/tournaments/${t.slug}`}
                        className="group bg-white border border-[#E5E7EB] hover:border-[#111111] rounded-xl p-3 sm:p-3.5 flex items-center justify-between transition-all shadow-sm hover:shadow-md flex-1 min-h-[70px]"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <TournamentBadge badgeType={t.badgeType} />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-[#111111] truncate leading-tight">{t.name}</div>
                            <div className="text-[11px] text-[#5F6368] truncate leading-tight mt-0.5">{t.subtitle}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {showA && (
            <div className={`${showT ? "lg:col-span-5" : "lg:col-span-12"} flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-base sm:text-lg font-bold text-[#111111]">{activityTitle}</h2>
                <Link href="/activity" className="inline-flex items-center space-x-1 text-xs font-semibold text-[#111111] hover:text-[#C79A3B] transition-colors">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-sm divide-y divide-[#F1F3F5] flex-1 flex flex-col">
                {activities.map((act) => {
                  const body = (
                    <>
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-[#F7F8FA] border border-[#E5E7EB] relative shrink-0">
                        <Image src={act.avatar} alt="" fill sizes="36px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-[#111111] font-bold leading-snug truncate">{act.text}</p>
                        <span className="text-[11px] text-[#6B7280] font-medium">{formatRelativeTime(act.createdAt)}</span>
                      </div>
                    </>
                  );
                  return act.href ? (
                    <Link key={act.id} href={act.href} className="py-2.5 sm:py-3 first:pt-0 last:pb-0 flex items-center space-x-3 hover:opacity-80">
                      {body}
                    </Link>
                  ) : (
                    <div key={act.id} className="py-2.5 sm:py-3 first:pt-0 last:pb-0 flex items-center space-x-3">
                      {body}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
