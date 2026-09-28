"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Timer, Users } from "lucide-react";
import { SiteSettings } from "@/lib/site-settings";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

export function CountdownBanner({
  countdown,
  tournament,
}: {
  countdown: SiteSettings["countdown"];
  tournament: { slug: string; name: string; currentParticipants: number; maxParticipants: number } | null;
}) {
  const target = new Date(countdown.targetDate).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = now === null ? null : target - now;
  const ended = remaining !== null && remaining <= 0;
  const p = parts(remaining ?? 0);
  const units: [number, string][] = [
    [p.days, "Days"],
    [p.hours, "Hours"],
    [p.minutes, "Mins"],
    [p.seconds, "Secs"],
  ];

  return (
    <section className="w-full py-3 sm:py-4">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#0F1012] text-white border border-white/10 shadow-sm">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#C79A3B]/20 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-6 lg:p-7">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C79A3B]/15 border border-[#C79A3B]/40 text-[#FBBF24] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                <Timer className="w-3.5 h-3.5" />
                <span>{ended ? "Closed" : countdown.label}</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-tight">{countdown.title}</h2>
              {countdown.description && <p className="text-xs sm:text-sm text-zinc-400">{countdown.description}</p>}
              {tournament && (
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-300 font-semibold">
                  <Users className="w-3.5 h-3.5 text-[#FBBF24]" />
                  <span>
                    {tournament.currentParticipants}/{tournament.maxParticipants} spots filled · {tournament.name}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {ended ? (
                <div className="text-sm font-bold text-zinc-300">{countdown.endedText}</div>
              ) : (
                <div className="grid grid-cols-4 gap-2" aria-live="polite">
                  {units.map(([v, label]) => (
                    <div key={label} className="min-w-[60px] sm:min-w-[68px] rounded-xl bg-white/5 border border-white/10 px-2 py-2.5 text-center">
                      <div className="text-xl sm:text-2xl font-black font-mono tabular-nums leading-none">{now === null ? "--" : String(v).padStart(2, "0")}</div>
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-400 font-bold mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              )}
              {!ended && countdown.ctaLabel && (
                <Link
                  href={countdown.ctaHref || (tournament ? `/tournaments/${tournament.slug}` : "/tournaments")}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-white text-black text-xs sm:text-sm font-bold hover:bg-zinc-200 transition-all min-h-[48px]"
                >
                  <span>{countdown.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
