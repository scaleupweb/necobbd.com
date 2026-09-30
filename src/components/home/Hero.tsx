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

          <div className="relative z-20 max-w-2xl px-4 pt-8 pb-14 sm:px-10 sm:pb-16 lg:px-14 space-y-4 sm:space-y-5">
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
          <div className="relative z-30 -mt-8 sm:-mt-10 mx-3 sm:mx-8 grid grid-cols-2 sm:grid-cols-4 rounded-2xl overflow-hidden bg-[#0B0C0F] text-white shadow-2xl ring-1 ring-white/10 divide-x divide-y sm:divide-y-0 divide-white/10">
            {stats.map((stat, idx) => (
              <div key={idx} className="relative px-4 sm:px-6 py-4 sm:py-5">
                <span className={`absolute left-0 top-4 bottom-4 w-1 rounded-r ${["bg-[#C79A3B]", "bg-emerald-400", "bg-sky-400", "bg-rose-400"][idx % 4]}`} />
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-mono">{stat.value}</div>
                <div className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mt-0.5 truncate">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
