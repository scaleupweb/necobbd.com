"use client";

import { useCallback, useEffect, useState } from "react";
import { Minus, Plus, Radio, Flag, Play } from "lucide-react";
import { api, Badge, Button, Empty, Notice, PageHeader } from "@/components/admin/ui";
import { ResultModal } from "@/components/admin/ResultModal";
import { formatTime } from "@/lib/utils";

export default function LiveDeskPage() {
  const [live, setLive] = useState<any[]>([]);
  const [today, setToday] = useState<any[]>([]);
  const [err, setErr] = useState("");
  const [finishing, setFinishing] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([api<any[]>("/api/admin/fixtures?status=LIVE"), api<any[]>("/api/admin/fixtures?status=SCHEDULED")]);
      setLive(l);
      const end = Date.now() + 24 * 3600000;
      setToday(s.filter((f) => new Date(f.scheduledDate).getTime() < end).sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate)));
    } catch (e: any) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const score = async (f: any, side: "home" | "away", delta: number) => {
    const next = { home: f.liveScore.home, away: f.liveScore.away };
    next[side] = Math.max(0, next[side] + delta);
    setLive((list) => list.map((x) => (x.id === f.id ? { ...x, liveScore: next } : x)));
    try {
      await api(`/api/admin/fixtures/${f.id}`, { method: "PATCH", json: { action: "SCORE", ...next } });
    } catch (e: any) {
      setErr(e.message);
      load();
    }
  };

  const start = async (f: any) => {
    try {
      await api(`/api/admin/fixtures/${f.id}`, { method: "PATCH", json: { action: "START" } });
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Live Match Desk" subtitle="Update live scores in real time. The public match pages refresh automatically." />
      {err && <Notice kind="err">{err}</Notice>}

      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-950 flex items-center gap-2">
          <Radio className="w-4 h-4 text-rose-600" /> Live now ({live.length})
        </h2>
        {live.length === 0 ? (
          <Empty>No live matches. Start one below or from Fixtures.</Empty>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {live.map((f) => (
              <div key={f.id} className="rounded-2xl bg-white border-2 border-rose-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">{[f.tournamentName, f.round].filter(Boolean).join(" · ")}</span>
                  <Badge tone="red">LIVE {f.minute}</Badge>
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  {(["home", "away"] as const).map((side, i) => (
                    <div key={side} className={`flex flex-col items-center gap-2 ${i === 1 ? "order-3" : ""}`}>
                      <div className="text-xs font-bold text-center truncate w-full">{f[`${side}Player`]?.fullName || f[`${side}Club`]?.name}</div>
                      <div className="flex items-center gap-1.5">
                        <Button small variant="secondary" onClick={() => score(f, side, -1)}>
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <Button small onClick={() => score(f, side, 1)}>
                          <Plus className="w-3.5 h-3.5" /> Goal
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="order-2 text-center text-4xl font-black font-mono tabular-nums">
                    {f.liveScore.home} - {f.liveScore.away}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="success" onClick={() => setFinishing(f)}>
                    <Flag className="w-4 h-4" /> Full time — confirm result
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-950">Coming up in the next 24 hours</h2>
        {today.length === 0 ? (
          <Empty>Nothing scheduled in the next 24 hours.</Empty>
        ) : (
          <div className="space-y-2">
            {today.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 text-xs">
                <div>
                  <div className="font-bold">
                    {f.homePlayer?.fullName || f.homeClub?.name} vs {f.awayPlayer?.fullName || f.awayClub?.name}
                  </div>
                  <div className="text-slate-500">{formatTime(f.scheduledDate)} · {f.tournamentName || f.round}</div>
                </div>
                <Button small variant="success" onClick={() => start(f)}>
                  <Play className="w-3.5 h-3.5" /> Go live
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {finishing && <ResultModal fixture={finishing} onClose={() => setFinishing(null)} onDone={load} />}
    </div>
  );
}
