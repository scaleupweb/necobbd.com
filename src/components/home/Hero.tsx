import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteSettings } from "@/lib/site-settings";

export function Hero({ hero, stats }: { hero: SiteSettings["hero"]; stats: { value: string; label: string }[] }) {
  return (
    <section className="relative w-full pt-2 sm:pt-4 pb-4 sm:pb-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative w-full min-h-[380px] sm:min-h-[400px] lg:min-h-[440px] rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm flex items-center">
          {hero.image && (
            <div className="absolute inset-0 z-0">
              <Image
                src={hero.image}
                alt={hero.headingLine1}
                fill
                priority
                className="object-cover object-right lg:object-center select-none pointer-events-none"
                sizes="(max-width: 1400px) 100vw, 1400px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-60% to-transparent z-10 sm:via-white/80 sm:via-45%"></div>
            </div>
          )}

          <div className="relative z-20 max-w-2xl px-4 py-8 sm:px-10 lg:px-14 space-y-4 sm:space-y-5">
            {hero.eyebrow && (
              <div className="inline-flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#C79A3B]"></span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#5F6368]">{hero.eyebrow}</span>
              </div>
            )}

            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-[#111111] tracking-tight leading-[1.1] text-balance">
              {hero.headingLine1} <br />
              <span>
                {hero.headingLine2} <span className="text-[#C79A3B]">{hero.highlightWord}</span>
              </span>
            </h1>

            {hero.supportingText && <p className="text-xs sm:text-base text-[#5F6368] font-normal max-w-lg leading-relaxed">{hero.supportingText}</p>}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5 pt-2">
              {hero.ctaPrimaryLabel && (
                <Link
                  href={hero.ctaPrimaryHref || "/register"}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold bg-[#111111] text-white hover:bg-zinc-800 transition-all shadow-sm min-h-[48px]"
                >
                  <span>{hero.ctaPrimaryLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {hero.ctaSecondaryLabel && (
                <Link
                  href={hero.ctaSecondaryHref || "/tournaments"}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold bg-white text-[#111111] border border-[#111111] hover:bg-[#F7F8FA] transition-all min-h-[48px]"
                >
                  <span>{hero.ctaSecondaryLabel}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {hero.showStats && stats.length > 0 && (
          <div className="mt-3 sm:mt-4 grid grid-cols-4 gap-2 sm:gap-3">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-2 sm:p-4 lg:p-5 flex flex-col justify-center items-center transition-all hover:border-[#111111] shadow-sm min-h-[64px] sm:min-h-[72px]"
              >
                <div className="text-base sm:text-2xl lg:text-3xl font-black text-[#111111] tracking-tight font-sans">{stat.value}</div>
                <div className="text-[9px] sm:text-xs font-semibold text-[#5F6368] uppercase tracking-wider mt-0.5 text-center truncate w-full">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
