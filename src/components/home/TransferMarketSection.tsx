import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap } from "lucide-react";
import type { HomepageData } from "@/lib/homepage";
import type { SiteSettings } from "@/lib/site-settings";

export function TransferMarketSection({ content, players }: { content: SiteSettings["sections"]["transfers"]; players: HomepageData["transferPlayers"] }) {
  return (
    <section className="w-full py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">{content.title}</h2>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
              <span>Open Now</span>
            </div>
          </div>
          <Link href="/transfer-market" className="inline-flex items-center space-x-1 text-xs sm:text-sm font-semibold text-[#111111] hover:text-[#C79A3B] transition-colors">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex overflow-x-auto lg:grid lg:grid-cols-7 gap-3.5 sm:gap-4 no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 items-stretch">
          {players.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.username}`}
              className="group w-[155px] sm:w-[170px] shrink-0 lg:w-auto lg:shrink lg:col-span-1 snap-start bg-white border border-[#E5E7EB] hover:border-[#111111] rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-gradient-to-b from-[#F3F4F6] to-[#E5E7EB] mb-2.5">
                <Image src={player.avatar} alt={player.name} fill sizes="180px" className="object-cover object-top group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="flex items-center space-x-1.5 mb-1 min-w-0">
                <span className="text-xs shrink-0">🇧🇩</span>
                <span className="text-xs sm:text-sm font-black text-[#111111] truncate">{player.name}</span>
              </div>
              <div className="mb-1.5 truncate">
                {player.status === "Free Agent" ? (
                  <div className="flex items-center space-x-1 text-[11px] font-bold text-[#D97706]">
                    <Zap className="w-3 h-3 fill-[#D97706]" />
                    <span>FREE AGENT</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-[#4B5563]">{player.status}</span>
                )}
              </div>
              <div className="text-base sm:text-lg font-black text-[#111111] font-mono tracking-tight leading-none pt-1 border-t border-[#F3F4F6]">{player.marketValue}</div>
            </Link>
          ))}

          <div
            className={`w-[280px] sm:w-[320px] shrink-0 lg:w-auto lg:shrink ${
              players.length ? "lg:col-span-2" : "lg:col-span-7"
            } snap-start bg-white border border-[#E5E7EB] hover:border-[#111111] rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-md transition-all min-h-[220px]`}
          >
            {content.promoImage && (
              <div className="absolute right-0 bottom-0 top-0 w-[45%] pointer-events-none overflow-hidden">
                <Image src={content.promoImage} alt="" fill sizes="300px" className="object-cover object-top opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
              </div>
            )}
            <div className="relative z-10 space-y-1.5 max-w-[65%]">
              <h3 className="text-xl sm:text-2xl font-black text-[#111111] leading-tight tracking-tight">{content.promoTitle}</h3>
              <p className="text-xs text-[#5F6368] font-medium leading-relaxed mt-2">{content.promoText}</p>
            </div>
            <div className="relative z-10 pt-4">
              <Link
                href="/transfer-market"
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm active:scale-95"
              >
                <span>{content.promoCta}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
