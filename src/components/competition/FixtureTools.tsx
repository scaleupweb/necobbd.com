"use client";

// Admin fixtures toolkit for a competition: status/round filters, reschedule, announcement text and posters.

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, Megaphone, ImageDown, Lock, Copy, Download, Loader2, Trophy, Star, Check, Pencil, PlayCircle } from "lucide-react";
import { api, Button, Modal, Notice, inputCls, toLocalInput, fromLocalInput } from "@/components/admin/ui";
import { toast } from "@/lib/feedback";
import { FixtureRounds, ClubLogo } from "./views";
import { THEMES, PosterTheme, renderMatchPoster, renderMotmPoster, resultSummary } from "./posters";
import { downloadCanvas } from "@/components/club-hub/canvas";

type Status = "ALL" | "ONGOING" | "UPCOMING" | "FINISHED";

export function fixtureState(f: any): Exclude<Status, "ALL"> {
  if (f.result?.status === "APPROVED") return "FINISHED";
  if (f.status === "LIVE" || new Date(f.scheduledDate).getTime() <= Date.now()) return "ONGOING";
  return "UPCOMING";
}

const blockKey = (f: any) => (f.stage === "GROUP" ? `G${f.roundNo}` : `K${f.roundNo}-${f.leg || 1}`);
const blockName = (f: any) => (f.stage === "GROUP" ? `Matchday ${(f.roundNo ?? 0) + 1}` : f.round);

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

export function FixturesPanel({ data, onOpenTie, reload }: { data: any; onOpenTie: (f: any) => void; reload: () => void }) {
  const fixtures: any[] = data.fixtures;
  const [status, setStatus] = useState<Status>("ALL");
  const [block, setBlock] = useState("ALL");
  const [scheduleOf, setScheduleOf] = useState<any>(null);
  const [posterOf, setPosterOf] = useState<any>(null);
  const [announce, setAnnounce] = useState(false);

  const counts = useMemo(() => {
    const c = { ALL: fixtures.length, ONGOING: 0, UPCOMING: 0, FINISHED: 0 };
    for (const f of fixtures) c[fixtureState(f)]++;
    return c;
  }, [fixtures]);
  const blocks = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of fixtures) if (!m.has(blockKey(f))) m.set(blockKey(f), blockName(f));
    return [...m.entries()];
  }, [fixtures]);
  const shown = fixtures.filter((f) => (status === "ALL" || fixtureState(f) === status) && (block === "ALL" || blockKey(f) === block));

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "ONGOING", "UPCOMING", "FINISHED"] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black tracking-wide transition-colors ${
                  status === s ? "bg-black text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "ONGOING" && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                {s}
                <span className={`px-1.5 rounded-md text-[10px] ${status === s ? "bg-amber-400 text-black" : "bg-white text-slate-500"}`}>{counts[s]}</span>
              </button>
            ))}
          </div>
          <Button small onClick={() => setAnnounce(true)}>
            <Megaphone className="w-3.5 h-3.5 text-amber-400" /> Match announcement
          </Button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {[["ALL", "All rounds"], ...blocks].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setBlock(k)}
              className={`shrink-0 px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                block === k ? "bg-amber-500 border-amber-500 text-black" : "bg-white border-slate-200 text-slate-600 hover:border-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {shown.length ? (
        <FixtureRounds
          fixtures={shown}
          renderAction={(f) => {
            const done = f.result?.status === "APPROVED";
            return (
              <div className="space-y-1.5 mt-1">
                {(f.judge || (!done && fixtureState(f) === "ONGOING")) && (
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    {f.judge ? <span className="text-slate-500 truncate">Judge: {f.judge}</span> : <span />}
                    {!done && fixtureState(f) === "ONGOING" && <span className="text-rose-600">● Due</span>}
                  </div>
                )}
                {!done && <div className="text-[10px] font-bold text-slate-500">{when(f.scheduledDate)}</div>}
                <div className="flex gap-1">
                  <button
                    onClick={() => onOpenTie(f)}
                    className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      done ? "bg-slate-50 text-slate-700 hover:bg-slate-100" : "bg-black text-white hover:bg-zinc-800"
                    }`}
                  >
                    {done ? (
                      <>
                        {f.rollbackLock ? <Lock className="w-3 h-3" /> : <Pencil className="w-3 h-3" />} {f.rollbackLock ? "View games" : "View / edit"}
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3 h-3" /> Enter result
                      </>
                    )}
                  </button>
                  {!done && (
                    <button onClick={() => setScheduleOf(f)} title="Reschedule, judge, group link" className="px-2 rounded-lg border border-slate-200 text-slate-600 hover:border-black">
                      <CalendarClock className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {done && (
                    <button onClick={() => setPosterOf(f)} title="Result posters" className="px-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                      <ImageDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {done && f.rollbackLock && (
                  <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1" title={f.rollbackLock}>
                    <Lock className="w-2.5 h-2.5" /> Rollback locked
                  </div>
                )}
              </div>
            );
          }}
        />
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500">No matches in this filter.</div>
      )}

      {scheduleOf && <ScheduleModal f={scheduleOf} onClose={() => setScheduleOf(null)} onSaved={reload} />}
      {posterOf && <PosterModal f={posterOf} tournament={data.tournament} onClose={() => setPosterOf(null)} />}
      {announce && <AnnouncementModal fixtures={fixtures} tournament={data.tournament} onClose={() => setAnnounce(false)} />}
    </div>
  );
}

/* ---------- Reschedule ---------- */

function ScheduleModal({ f, onClose, onSaved }: { f: any; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(toLocalInput(f.scheduledDate));
  const [judge, setJudge] = useState(f.judge || "");
  const [link, setLink] = useState(f.groupLink || "");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/fixtures/${f.id}/tie`, { method: "PATCH", json: { scheduledDate: fromLocalInput(date), judge, groupLink: link } });
      toast.success("Match updated");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const shift = (days: number) => {
    const d = new Date(date || f.scheduledDate);
    d.setDate(d.getDate() + days);
    setDate(toLocalInput(d.toISOString()));
  };
  return (
    <Modal open onClose={onClose} title="Reschedule match">
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <ClubLogo club={f.homeClub} size={30} />
          <span className="text-xs font-black truncate">{f.homeClub?.name}</span>
          <span className="text-[10px] font-black text-slate-400">VS</span>
          <span className="text-xs font-black truncate">{f.awayClub?.name}</span>
          <ClubLogo club={f.awayClub} size={30} />
        </div>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-slate-700">Date & time</span>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          <span className="flex flex-wrap gap-1.5 pt-1">
            {[1, 2, 3, 7].map((d) => (
              <button key={d} type="button" onClick={() => shift(d)} className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600">
                +{d} day{d > 1 ? "s" : ""}
              </button>
            ))}
          </span>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-slate-700">Judge (optional)</span>
          <input value={judge} onChange={(e) => setJudge(e.target.value)} placeholder="Who checks this match" className={inputCls} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-slate-700">Captains&apos; group link (optional)</span>
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://m.me/j/…" className={inputCls} />
          <span className="block text-[10px] text-slate-400">Only admins see this. It goes into the announcement text.</span>
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || !date}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Announcement text ---------- */

function AnnouncementModal({ fixtures, tournament, onClose }: { fixtures: any[]; tournament: any; onClose: () => void }) {
  const notPlayed = fixtures.filter((f) => f.result?.status !== "APPROVED");
  const lists = {
    ONGOING: notPlayed.filter((f) => fixtureState(f) === "ONGOING"),
    UPCOMING: notPlayed.filter((f) => fixtureState(f) === "UPCOMING"),
    ALL: fixtures,
  };
  const [tab, setTab] = useState<keyof typeof lists>(lists.ONGOING.length ? "ONGOING" : "UPCOMING");
  const list = lists[tab];
  const [picked, setPicked] = useState<Set<string>>(() => new Set(list.map((f) => f.id)));
  useEffect(() => setPicked(new Set(lists[tab].map((f) => f.id))), [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const build = () => {
    const chosen = fixtures.filter((f) => picked.has(f.id));
    const parts = [`📢 MATCH ANNOUNCEMENT 📢`, tournament.name.toUpperCase()];
    for (const f of chosen) {
      parts.push(
        "",
        `⚔️ ${f.homeClub?.name} 🆚 ${f.awayClub?.name}`,
        `📅 ${when(f.scheduledDate)} | ${f.round}`,
        ...(f.judge ? [`👨‍⚖️ Judge: ${f.judge}`] : []),
        ...(f.groupLink ? [`💬 Group: ${f.groupLink}`] : [])
      );
    }
    parts.push("", "Please be on time. Good luck! ⚽");
    return parts.join("\n");
  };
  const [text, setText] = useState("");
  useEffect(() => setText(build()), [picked]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Announcement copied");
    } catch {
      toast.error("Could not copy — select the text and copy it manually");
    }
  };

  return (
    <Modal open onClose={onClose} title="Match announcement" wide>
      <div className="space-y-4">
        <p className="text-[11px] text-slate-500">Pick the matches; a ready text is made for the captains&apos; group. You can still edit it before copying.</p>
        <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-100">
          <div className="flex gap-1">
            {(Object.keys(lists) as (keyof typeof lists)[]).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-xl text-[11px] font-black ${tab === k ? "bg-black text-white" : "text-slate-600"}`}>
                {k[0] + k.slice(1).toLowerCase()} ({lists[k].length})
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <Button small variant="secondary" onClick={() => setPicked(new Set(list.map((f) => f.id)))}>
              Select all
            </Button>
            <Button small variant="secondary" onClick={() => setPicked(new Set())}>
              Clear
            </Button>
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
          {list.length === 0 && <div className="text-center text-xs text-slate-500 py-6">No matches here.</div>}
          {list.map((f) => {
            const on = picked.has(f.id);
            return (
              <label key={f.id} className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer ${on ? "border-amber-400 bg-amber-50/60" : "border-slate-200"}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    setPicked((s) => {
                      const n = new Set(s);
                      if (n.has(f.id)) n.delete(f.id);
                      else n.add(f.id);
                      return n;
                    })
                  }
                  className="accent-black w-4 h-4"
                />
                <span className="text-xs font-black truncate">{f.homeClub?.name}</span>
                <span className="text-[10px] font-black text-amber-600">VS</span>
                <span className="text-xs font-black truncate">{f.awayClub?.name}</span>
                <span className="ml-auto text-[10px] text-slate-500 shrink-0">{f.round}</span>
              </label>
            );
          })}
        </div>
        <div className="space-y-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">Text preview</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} className={`${inputCls} font-mono !text-[11px] leading-relaxed`} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={copy} disabled={!picked.size}>
            <Copy className="w-3.5 h-3.5" /> Copy announcement
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Posters ---------- */

function PosterModal({ f, tournament, onClose }: { f: any; tournament: any; onClose: () => void }) {
  const [full, setFull] = useState<any>(null);
  const [theme, setTheme] = useState<PosterTheme>("gold");
  const [kind, setKind] = useState<"result" | "motm">("result");
  const [busy, setBusy] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const site = typeof window !== "undefined" ? window.location.host : "necobbd.com";

  useEffect(() => {
    api(`/api/admin/fixtures/${f.id}/tie`)
      .then((d) => setFull(d.fixture))
      .catch((e) => toast.error(e.message));
  }, [f.id]);

  useEffect(() => {
    if (!full || !canvas.current) return;
    let alive = true;
    setBusy(true);
    const data = { tournament, fixture: full, site };
    // Draw off-screen and copy over only if this is still the latest choice (quick theme/tab switches overlap).
    const off = document.createElement("canvas");
    (kind === "result" ? renderMatchPoster(off, data, theme) : renderMotmPoster(off, data, theme))
      .then(() => {
        const c = canvas.current;
        if (!alive || !c) return;
        c.width = off.width;
        c.height = off.height;
        c.getContext("2d")!.drawImage(off, 0, 0);
      })
      .catch((e) => alive && toast.error(e.message || "Could not draw the poster"))
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [full, theme, kind, tournament, site]);

  const fileBase = `${f.homeClub?.shortName || "home"}-vs-${f.awayClub?.shortName || "away"}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const download = async () => {
    try {
      await downloadCanvas(canvas.current!, `${fileBase}-${kind}.png`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(resultSummary({ tournament, fixture: full }));
      toast.success("Result text copied");
    } catch {
      toast.error("Could not copy");
    }
  };
  const hasMotm = !!full?.result?.motmPlayerId;

  return (
    <Modal open onClose={onClose} title="Match posters" wide>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
            <button onClick={() => setKind("result")} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black ${kind === "result" ? "bg-white shadow text-black" : "text-slate-500"}`}>
              <Trophy className="w-3.5 h-3.5" /> Match result
            </button>
            <button
              onClick={() => setKind("motm")}
              disabled={!hasMotm}
              title={hasMotm ? "" : "No Man of the Match was picked for this match"}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black disabled:opacity-40 ${kind === "motm" ? "bg-white shadow text-black" : "text-slate-500"}`}
            >
              <Star className="w-3.5 h-3.5" /> MOTM award
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Theme</span>
            {(Object.keys(THEMES) as PosterTheme[]).map((k) => (
              <button
                key={k}
                onClick={() => setTheme(k)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${theme === k ? "border-black bg-black text-white" : "border-slate-200 text-slate-600"}`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: THEMES[k].swatch }} /> {THEMES[k].label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative rounded-2xl bg-slate-900 p-3 flex justify-center">
          {(!full || busy) && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-10 rounded-2xl">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}
          <canvas ref={canvas} className="max-h-[55vh] w-auto max-w-full rounded-xl shadow-2xl" style={{ aspectRatio: "auto" }} />
        </div>
        {!full && <Notice kind="ok">Loading the match…</Notice>}
        <div className="flex flex-wrap justify-end gap-2">
          {kind === "result" && (
            <Button variant="secondary" onClick={copySummary} disabled={!full}>
              <Copy className="w-3.5 h-3.5" /> Copy result text
            </Button>
          )}
          <Button variant="success" onClick={download} disabled={!full || busy}>
            <Download className="w-3.5 h-3.5" /> Download PNG
          </Button>
        </div>
      </div>
    </Modal>
  );
}
