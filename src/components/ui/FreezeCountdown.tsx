"use client";

import { useEffect, useState } from "react";
import { Snowflake } from "lucide-react";
import { FREEZE_DAYS } from "@/lib/squad";

/** Ticks every second while the freeze is running; null until mounted (avoids a hydration mismatch). */
function useRemaining(until?: string | Date | null) {
  const end = until ? new Date(until).getTime() : 0;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if (!end) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= end) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [end]);
  if (!end || now === null) return null;
  const ms = end - now;
  if (ms <= 0) return 0;
  return ms;
}

function parts(ms: number) {
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const pad = (n: number) => String(n).padStart(2, "0");

/** Small "❄ 2d 05:12:33" chip for lists and cards. Renders nothing once the freeze is over. */
export function FreezeChip({ until, className = "", label = true }: { until?: string | Date | null; className?: string; label?: boolean }) {
  const ms = useRemaining(until);
  if (!ms) return null;
  const p = parts(ms);
  return (
    <span
      title={`Frozen until ${new Date(until!).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-black tabular-nums whitespace-nowrap ${className}`}
    >
      <Snowflake className="w-3 h-3" />
      {label && "Frozen · "}
      {p.d > 0 && `${p.d}d `}
      {pad(p.h)}:{pad(p.m)}:{pad(p.s)}
    </span>
  );
}

/** Big countdown panel for the player profile: days / hours / minutes / seconds and a progress bar. */
export function FreezeCountdownCard({ until, clubName }: { until?: string | Date | null; clubName?: string }) {
  const ms = useRemaining(until);
  if (!ms) return null;
  const p = parts(ms);
  const total = FREEZE_DAYS * 86400000;
  const done = Math.min(100, Math.max(0, ((total - ms) / total) * 100));
  const endText = new Date(until!).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const box = (v: number, l: string) => (
    <div className="flex-1 rounded-2xl bg-white/10 border border-white/15 py-2.5 text-center backdrop-blur">
      <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums leading-none">{l === "Days" ? v : pad(v)}</div>
      <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-sky-100/70">{l}</div>
    </div>
  );
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 text-white p-5 shadow-sm">
      <Snowflake aria-hidden className="absolute -right-6 -top-6 w-32 h-32 text-white/10" />
      <div className="relative flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
          <Snowflake className="w-4 h-4" />
        </span>
        <div>
          <div className="text-sm font-black">Frozen after joining{clubName ? ` ${clubName}` : ""}</div>
          <div className="text-[11px] text-sky-100/80">No activity for {FREEZE_DAYS} days after a signing</div>
        </div>
      </div>
      <div className="relative mt-4 flex gap-2">
        {box(p.d, "Days")}
        {box(p.h, "Hours")}
        {box(p.m, "Min")}
        {box(p.s, "Sec")}
      </div>
      <div className="relative mt-4 h-1.5 rounded-full bg-white/15 overflow-hidden">
        <div className="h-full rounded-full bg-white transition-[width] duration-1000" style={{ width: `${done}%` }} />
      </div>
      <div className="relative mt-2 text-[11px] text-sky-100/80">Ends {endText}</div>
    </div>
  );
}
