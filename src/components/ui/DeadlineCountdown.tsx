"use client";

import { useEffect, useState } from "react";

export function DeadlineCountdown({ target, className = "" }: { target: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <div className={`text-xl font-black font-mono ${className}`}>--:--:--</div>;
  const ms = new Date(target).getTime() - now;
  if (ms <= 0) return <div className={`text-sm font-bold text-rose-600 ${className}`}>Closed</div>;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return (
    <div className={`text-xl font-black font-mono tabular-nums ${className}`}>
      {d > 0 && <span>{d}d </span>}
      {h}:{m}:{sec}
    </div>
  );
}
