import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { SiteSettings } from "@/lib/site-settings";

// Split hero: copy sits on a solid dark panel and the artwork lives in its own
// frame, so the heading never has to fight the photo for contrast.
export function Hero({ hero, stats }: { hero: SiteSettings["hero"]; stats: { value: string; label: string }[] }) {
  const showStats = hero.showStats && stats.length > 0;
  return (
    <section className="relative w-full pt-2 sm:pt-4 pb-4 sm:pb-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0B0C0F] text-white ring-1 ring-black/5 shadow-xl">
          {/* Background: faint grid + warm glow */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07] [mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_75%)]"
            style={{
              backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div aria-hidden className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-[#C79A3B]/25 blur-[120px]" />
          <div aria-hidden className="absolute -bottom-40 right-0 w-[380px] h-[380px] rounded-full bg-sky-500/10 blur-[120px]" />

          <div className="relative grid lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-10 p-5 sm:p-8 lg:p-12 items-center">
            {/* Copy */}
            <div className="space-y-5 sm:space-y-6 text-center lg:text-left">
              {hero.eyebrow && (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#C79A3B] opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C79A3B]" />
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">{hero.eyebrow}</span>
                </div>
              )}

              <h1 className="text-[32px] leading-[1.05] sm:text-5xl lg:text-[60px] font-black tracking-tight text-balance">
                <span className="block">{hero.headingLine1}</span>
                <span className="block">
                  {hero.headingLine2}{" "}
                  <span className="bg-gradient-to-r from-[#F3D48A] via-[#C79A3B] to-[#E8B95A] bg-clip-text text-transparent">{hero.highlightWord}</span>
                </span>
              </h1>

              {hero.supportingText && (
                <p className="text-sm sm:text-base lg:text-lg text-white/65 leading-relaxed max-w-xl mx-auto lg:mx-0">{hero.supportingText}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
                {hero.ctaPrimaryLabel && (
                  <Link
                    href={hero.ctaPrimaryHref || "/register"}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#C79A3B] px-6 py-3.5 text-sm font-bold text-black shadow-[0_8px_30px_-8px_rgba(199,154,59,0.7)] hover:bg-[#D9AD4F] transition-all min-h-[48px]"
                  >
                    {hero.ctaPrimaryLabel}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
                {hero.ctaSecondaryLabel && (
                  <Link
                    href={hero.ctaSecondaryHref || "/tournaments"}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/25 transition-all min-h-[48px]"
                  >
                    <Trophy className="w-4 h-4 text-[#C79A3B]" />
                    {hero.ctaSecondaryLabel}
                  </Link>
                )}
              </div>
            </div>

            {/* Artwork */}
            {hero.image && (
              <div className="relative">
                <div aria-hidden className="absolute -inset-2 rounded-[28px] bg-gradient-to-br from-[#C79A3B]/40 via-transparent to-sky-500/20 blur-xl" />
                <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[5/4] overflow-hidden rounded-2xl sm:rounded-3xl ring-1 ring-white/15 bg-zinc-900">
                  <Image
                    src={hero.image}
                    alt={hero.headingLine1}
                    fill
                    priority
                    className="object-cover object-[70%_center] select-none"
                    sizes="(max-width: 1024px) 100vw, 640px"
                  />
                  <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              </div>
            )}
          </div>

          {showStats && (
            <div className="relative grid grid-cols-2 sm:grid-cols-4 border-t border-white/10 divide-x divide-white/10 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-white/10 sm:[&>*:nth-child(n+3)]:border-t-0">
              {stats.map((stat, idx) => (
                <div key={idx} className="px-4 sm:px-6 py-4 sm:py-5 text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">{stat.value}</div>
                  <div className="mt-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/45 truncate">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
