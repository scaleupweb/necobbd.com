"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Timer, Trophy, Users } from "lucide-react";
import { SiteSettings } from "@/lib/site-settings";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

/** One flip-style digit tile; the value re-mounts on change so it drops in. */
function Tile({ value, label, ready }: { value: number; label: string; ready: boolean }) {
  const v = ready ? String(value).padStart(2, "0") : "--";
  return (
    <div className="relative flex-1 min-w-0">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1d1e24] to-[#0b0c0f] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_30px_-12px_rgba(0,0,0,0.8)] px-1 pt-3 pb-2.5 sm:pt-4 sm:pb-3">
        {/* fold line */}
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-white/[0.03]" />
        <div
          key={v}
          className="cd-drop relative text-center font-black font-mono tabular-nums leading-none text-[34px] sm:text-[44px] lg:text-[52px] bg-gradient-to-b from-[#FFF3C4] via-[#F7DC8B] to-[#C79A3B] bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(232,185,90,0.35)]"
        >
          {v}
        </div>
      </div>
      <div className="mt-2 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-white/50">{label}</div>
    </div>
  );
}

export function CountdownBanner({
  countdown,
  tournament,
  preview = false,
}: {
  countdown: SiteSettings["countdown"];
  tournament: { slug: string; name: string; currentParticipants: number; maxParticipants: number } | null;
  /** Admin preview: no outer page spacing, links don't navigate. */
  preview?: boolean;
}) {
  const target = new Date(countdown.targetDate).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = now === null || isNaN(target) ? null : target - now;
  const ended = remaining !== null && remaining <= 0;
  const lastDay = remaining !== null && remaining > 0 && remaining < 86400000;
  const p = parts(remaining ?? 0);
  const ready = remaining !== null;
  const spotsLeft = tournament ? Math.max(0, tournament.maxParticipants - tournament.currentParticipants) : 0;
  const filled = tournament && tournament.maxParticipants ? Math.min(100, Math.round((tournament.currentParticipants / tournament.maxParticipants) * 100)) : 0;
  const href = countdown.ctaHref || (tournament ? `/tournaments/${tournament.slug}` : "/tournaments");

  const card = (
    <div className="cd-border relative rounded-[28px] p-[1.5px]">
      <div className="relative overflow-hidden rounded-[27px] bg-[#08090C] text-white">
        {/* backdrop */}
        <div aria-hidden className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-[#C79A3B]/25 blur-[110px]" />
        <div aria-hidden className="absolute -bottom-40 -right-20 w-[460px] h-[460px] rounded-full bg-[#7c3aed]/15 blur-[120px]" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]"
        />
        <Trophy aria-hidden className="absolute -right-10 -bottom-12 w-72 h-72 text-white/[0.035] rotate-12" />

        <div
          className={`relative grid grid-cols-1 gap-6 items-center p-5 sm:p-7 ${preview ? "" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-10 lg:p-9"}`}
        >
          {/* Copy */}
          <div className="space-y-3.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] ${
                  ended ? "bg-white/10 text-white/70" : lastDay ? "bg-rose-500/15 border border-rose-400/40 text-rose-300" : "bg-[#C79A3B]/15 border border-[#C79A3B]/40 text-[#F7DC8B]"
                }`}
              >
                {!ended && (
                  <span className="relative flex w-2 h-2">
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${lastDay ? "bg-rose-400" : "bg-[#F7DC8B]"}`} />
                    <span className={`relative inline-flex rounded-full w-2 h-2 ${lastDay ? "bg-rose-400" : "bg-[#F7DC8B]"}`} />
                  </span>
                )}
                {ended ? <Timer className="w-3.5 h-3.5" /> : null}
                {ended ? "Closed" : countdown.label}
              </span>
              {lastDay && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider">
                  <Flame className="w-3 h-3" /> Last day
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-black tracking-tight leading-[1.05]">
              <span className="bg-gradient-to-r from-white via-white to-[#F7DC8B] bg-clip-text text-transparent">{countdown.title}</span>
            </h2>
            {countdown.description && <p className="text-sm sm:text-base text-white/60 max-w-lg">{countdown.description}</p>}

            {tournament && (
              <div className="max-w-md space-y-1.5 pt-1">
                <div className="flex items-center justify-between gap-3 text-[11px] sm:text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5 text-white/80 min-w-0">
                    <Users className="w-3.5 h-3.5 text-[#F7DC8B] shrink-0" />
                    <span className="truncate">{tournament.name}</span>
                  </span>
                  <span className={`shrink-0 ${spotsLeft <= 5 ? "text-rose-300" : "text-[#F7DC8B]"}`}>
                    {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left` : "Full"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="cd-bar h-full rounded-full bg-gradient-to-r from-[#F7DC8B] via-[#E8B95A] to-[#C79A3B]" style={{ width: `${Math.max(4, filled)}%` }} />
                </div>
                <div className="text-[10px] text-white/40 font-semibold">
                  {tournament.currentParticipants}/{tournament.maxParticipants} registered
                </div>
              </div>
            )}

            {!ended && countdown.ctaLabel && (
              <div className="pt-1">
                {preview ? (
                  <span className="cd-cta inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black text-[#0B0C0F]">
                    {countdown.ctaLabel} <ArrowRight className="w-4 h-4" />
                  </span>
                ) : (
                  <Link href={href} className="cd-cta group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black text-[#0B0C0F] min-h-[48px]">
                    {countdown.ctaLabel}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Clock */}
          {ended ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <Timer className="w-10 h-10 mx-auto text-white/30" />
              <div className="mt-3 text-lg font-black text-white/80">{countdown.endedText}</div>
            </div>
          ) : (
            <div aria-live="polite" className="min-w-0">
              <div className="flex items-start gap-1.5 sm:gap-3">
                <Tile value={p.days} label="Days" ready={ready} />
                <span className="cd-colon pt-4 sm:pt-6 text-2xl sm:text-4xl font-black text-[#C79A3B]/70">:</span>
                <Tile value={p.hours} label="Hours" ready={ready} />
                <span className="cd-colon pt-4 sm:pt-6 text-2xl sm:text-4xl font-black text-[#C79A3B]/70">:</span>
                <Tile value={p.minutes} label="Mins" ready={ready} />
                <span className="cd-colon pt-4 sm:pt-6 text-2xl sm:text-4xl font-black text-[#C79A3B]/70">:</span>
                <Tile value={p.seconds} label="Secs" ready={ready} />
              </div>
              {ready && (
                <div className="mt-4 text-center text-[11px] text-white/45 font-semibold">
                  Closes{" "}
                  {new Date(target).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (preview) return card;
  return (
    <section className="w-full pb-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">{card}</div>
    </section>
  );
}
