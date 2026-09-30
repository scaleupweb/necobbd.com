import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Crown, Sparkles, Trophy, ShieldCheck, Award } from "lucide-react";
import type { HomeStar } from "@/lib/homepage";
import { SectionHeader } from "./SectionHeader";

function CategoryIcon({ iconType }: { iconType?: string }) {
  switch (iconType) {
    case "diamond-blue":
      return <Sparkles className="w-4 h-4 text-[#0EA5E9] fill-[#0EA5E9] shrink-0" />;
    case "trophy-green":
      return <Trophy className="w-4 h-4 text-[#16A34A] fill-[#16A34A] shrink-0" />;
    case "shield-blue":
      return <ShieldCheck className="w-4 h-4 text-[#2563EB] fill-[#2563EB] shrink-0" />;
    case "star-orange":
      return <Award className="w-4 h-4 text-[#EA580C] fill-[#EA580C] shrink-0" />;
    default:
      return <Crown className="w-4 h-4 text-[#EAB308] fill-[#EAB308] shrink-0" />;
  }
}

export function WeeklyStarsSection({ title, subtitle, stars }: { title: string; subtitle: string; stars: HomeStar[] }) {
  return (
    <section className="w-full py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader icon={Crown} title={title} subtitle={subtitle} href="/rankings" accent="bg-[#C79A3B] text-black" />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {stars.map((star) => (
            <Link
              key={star.id}
              href={`/players/${star.username}`}
              className="group bg-white border border-[#E5E7EB] hover:border-[#111111] rounded-2xl p-3 sm:p-4 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md h-full"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#111111] mb-2.5">
                <CategoryIcon iconType={star.iconType} />
                <span className="truncate">{star.category}</span>
              </div>
              <div className="relative w-full h-32 sm:h-36 rounded-2xl overflow-hidden bg-gradient-to-b from-[#F3F4F6] to-[#E5E7EB] mb-3">
                <Image src={star.avatar} alt={star.playerName} fill sizes="200px" className="object-cover object-top group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="flex items-center space-x-2 min-w-0 mb-3">
                {star.clubLogo ? (
                  <div className="w-6 h-6 rounded-md overflow-hidden relative shrink-0 border border-[#E5E7EB]">
                    <Image src={star.clubLogo} alt="" fill sizes="24px" className="object-cover" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-md bg-[#111111] text-white flex items-center justify-center text-[9px] font-bold shrink-0">★</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-[#111111] truncate leading-tight">{star.playerName}</div>
                  <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider truncate leading-tight mt-0.5">{star.clubName}</div>
                </div>
              </div>
              <div className="pt-2.5 border-t border-[#F3F4F6] flex items-baseline space-x-1">
                <span className="text-xl sm:text-2xl font-black text-[#111111] font-mono tracking-tight leading-none">{star.statValue}</span>
                {star.statUnit && <span className="text-xs font-semibold text-[#6B7280]">{star.statUnit}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
