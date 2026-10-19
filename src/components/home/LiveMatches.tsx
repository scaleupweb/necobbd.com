import Link from "next/link";
import Image from "next/image";
import { Swords } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import type { HomeMatch } from "@/lib/homepage";

export function LiveMatches({ title, matches }: { title: string; matches: HomeMatch[] }) {
  const anyLive = matches.some((m) => m.isLive);

  return (
    <section className="w-full py-6 sm:py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          icon={Swords}
          title={anyLive ? title : "Matches"}
          subtitle={anyLive ? "Happening right now" : "Upcoming and recent"}
          href="/matches"
          accent={anyLive ? "bg-red-600 text-white" : "bg-black text-white"}
          badge={anyLive ? <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" /> : undefined}
        />

        <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-3.5 sm:gap-4 no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
          {matches.map((match) => (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="w-[285px] sm:w-[320px] shrink-0 md:w-auto md:shrink snap-start home-card p-4 sm:p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                    match.isLive ? "bg-[#DC2626] text-white" : "bg-[#F3F4F6] text-[#111111] border border-[#E5E7EB]"
                  }`}
                >
                  {match.label}
                </span>
                <span className="text-xs font-medium text-[#5F6368] truncate max-w-[160px]">{match.tournament}</span>
              </div>

              <div className="py-2 grid grid-cols-5 items-center justify-between gap-2">
                {[match.home, null, match.away].map((side, i) =>
                  side ? (
                    <div key={i} className="col-span-2 flex flex-col items-center text-center space-y-1.5 min-w-0">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-[#F7F8FA] border border-[#E5E7EB] relative shrink-0 p-0.5">
                        <Image src={side.logo} alt={side.name} fill sizes="44px" className="object-cover rounded-lg" />
                      </div>
                      <span className="text-xs font-bold text-[#111111] uppercase tracking-tight truncate w-full">{side.name}</span>
                    </div>
                  ) : (
                    <div key={i} className="col-span-1 flex items-center justify-center">
                      <div className="h-10 px-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-center space-x-2 text-[#111111] font-heading font-extrabold text-base sm:text-lg tabular-nums select-none min-w-[72px] shadow-xs">
                        {match.homeScore === null ? (
                          <span className="text-xs font-bold text-[#5F6368]">VS</span>
                        ) : (
                          <>
                            <span className="w-4 text-center leading-none">{match.homeScore}</span>
                            <span className="text-[#888888] font-normal text-sm leading-none">-</span>
                            <span className="w-4 text-center leading-none">{match.awayScore}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
