import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { SiteSettings } from "@/lib/site-settings";

export function CommunityCTA({ cta }: { cta: SiteSettings["cta"] }) {
  return (
    <section className="w-full py-6 sm:py-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="cd-border relative rounded-[28px] p-[1.5px] shadow-xl">
          <div className="relative rounded-[27px] bg-[#08090C] overflow-hidden min-h-[300px] sm:min-h-[340px] flex items-center">
          <div aria-hidden className="absolute -top-28 -left-20 w-96 h-96 rounded-full bg-[#C79A3B]/25 blur-[110px]" />
          <div aria-hidden className="absolute -bottom-32 right-10 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px]" />
          {cta.image && (
            <div className="absolute inset-0 z-0 flex justify-end pointer-events-none">
              <div className="relative w-full md:w-2/3 h-full">
                <Image src={cta.image} alt="" fill sizes="900px" className="object-cover object-right opacity-40 md:opacity-65 select-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#08090C] via-[#08090C]/80 to-transparent"></div>
              </div>
            </div>
          )}

          <div className="relative z-10 max-w-xl px-5 py-8 sm:px-10 lg:px-14 space-y-4">
            {cta.badge && (
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C79A3B]/15 text-[#F7DC8B] border border-[#C79A3B]/40 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">
                <Sparkles className="w-3.5 h-3.5 text-[#C79A3B]" />
                <span>{cta.badge}</span>
              </div>
            )}
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {cta.titleLine1} <br />
              <span className="bg-gradient-to-r from-[#FFF3C4] via-[#E8B95A] to-[#C79A3B] bg-clip-text text-transparent">{cta.highlight}</span>
            </h2>
            {cta.text && <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-md">{cta.text}</p>}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
              {cta.primaryLabel && (
                <Link
                  href={cta.primaryHref || "/register"}
                  className="cd-cta w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black text-[#0B0C0F] min-h-[48px]"
                >
                  {cta.primaryLabel}
                </Link>
              )}
              {cta.secondaryLabel && (
                <Link
                  href={cta.secondaryHref || "/about"}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold bg-transparent text-white border border-white/25 hover:bg-white/10 hover:border-white/50 transition-all min-h-[48px]"
                >
                  {cta.secondaryLabel}
                </Link>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
