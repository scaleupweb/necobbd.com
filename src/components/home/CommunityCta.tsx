import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { SiteSettings } from "@/lib/site-settings";

export function CommunityCTA({ cta }: { cta: SiteSettings["cta"] }) {
  return (
    <section className="w-full py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-[#111111] overflow-hidden border border-zinc-800 shadow-xl min-h-[300px] sm:min-h-[340px] flex items-center">
          {cta.image && (
            <div className="absolute inset-0 z-0 flex justify-end pointer-events-none">
              <div className="relative w-full md:w-2/3 h-full">
                <Image src={cta.image} alt="" fill sizes="900px" className="object-cover object-right opacity-40 md:opacity-65 select-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/80 to-transparent"></div>
              </div>
            </div>
          )}

          <div className="relative z-10 max-w-xl px-5 py-8 sm:px-10 lg:px-14 space-y-4">
            {cta.badge && (
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-white/10 text-slate-200 border border-white/20 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#C79A3B]" />
                <span>{cta.badge}</span>
              </div>
            )}
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {cta.titleLine1} <br />
              <span className="text-[#C79A3B]">{cta.highlight}</span>
            </h2>
            {cta.text && <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-md">{cta.text}</p>}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
              {cta.primaryLabel && (
                <Link
                  href={cta.primaryHref || "/register"}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold bg-white text-[#111111] hover:bg-slate-100 transition-all shadow-sm min-h-[48px]"
                >
                  {cta.primaryLabel}
                </Link>
              )}
              {cta.secondaryLabel && (
                <Link
                  href={cta.secondaryHref || "/about"}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold bg-transparent text-white border border-white/40 hover:bg-white/10 transition-all min-h-[48px]"
                >
                  {cta.secondaryLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
