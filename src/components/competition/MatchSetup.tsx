"use client";

// Admin "Match setup": schedule, captains, the 1v1 lineup in time slots, the captains' code and the auto text.

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Users, KeyRound, Copy, RefreshCw, Loader2, Check, Plus, Trash2, Wand2, ExternalLink, ListOrdered } from "lucide-react";
import { api, Button, Modal, Notice, inputCls, toLocalInput, fromLocalInput } from "@/components/admin/ui";
import { toast, confirmDialog } from "@/lib/feedback";
import { buildMatchText } from "@/lib/match-text";
import { ClubLogo } from "./views";

type Slot = { id: string; label: string; time: string }; // time = datetime-local value while editing
type Row = { homePlayerId: string; awayPlayerId: string; host: "" | "HOME" | "AWAY"; slotId: string };

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  } catch {
    toast.error("Could not copy — select it and copy by hand");
  }
}

export function MatchSetupModal({ fixtureId, onClose, onSaved }: { fixtureId: string; onClose: () => void; onSaved: () => void }) {
  const [sheet, setSheet] = useState<any>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"schedule" | "lineup" | "code">("schedule");
  const [busy, setBusy] = useState(false);

  // schedule
  const [date, setDate] = useState("");
  const [judge, setJudge] = useState("");
  const [link, setLink] = useState("");
  const [homeCap, setHomeCap] = useState("");
  const [awayCap, setAwayCap] = useState("");
  // lineup
  const [slots, setSlots] = useState<Slot[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [minutes, setMinutes] = useState(10);

  const load = () =>
    api(`/api/admin/fixtures/${fixtureId}/tie`)
      .then((d) => {
        setSheet(d);
        setDate(toLocalInput(d.fixture.scheduledDate));
        setJudge(d.judge || "");
        setLink(d.groupLink || "");
        setHomeCap(d.captains.home || "");
        setAwayCap(d.captains.away || "");
        const L = d.lineup;
        const s: Slot[] = L?.slots?.length ? L.slots.map((x: any) => ({ id: x.id, label: x.label, time: toLocalInput(x.time) })) : [{ id: "s1", label: "Match time", time: toLocalInput(d.fixture.scheduledDate) }];
        setSlots(s);
        setMinutes(L?.minutes || 10);
        const n = Math.max(d.playersPerTie, L?.rows?.length || 0);
        setRows(Array.from({ length: n }, (_, i) => L?.rows?.[i] || { homePlayerId: "", awayPlayerId: "", host: i % 2 ? "AWAY" : "HOME", slotId: s[0].id }));
      })
      .catch((e) => setErr(e.message));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureId]);

  const f = sheet?.fixture;
  const players = useMemo(() => new Map<string, any>([...(sheet?.homeSquad || []), ...(sheet?.awaySquad || [])].map((p: any) => [p.id, p])), [sheet]);
  const save = async (json: any, msg: string) => {
    setBusy(true);
    try {
      await api(`/api/admin/fixtures/${fixtureId}/tie`, { method: "PATCH", json });
      toast.success(msg);
      onSaved();
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const usedH = new Set(rows.map((r) => r.homePlayerId).filter(Boolean));
  const usedA = new Set(rows.map((r) => r.awayPlayerId).filter(Boolean));
  const filled = rows.filter((r) => r.homePlayerId && r.awayPlayerId);
  const lineupJson = () => ({
    minutes,
    slots: slots.map((s) => ({ ...s, time: fromLocalInput(s.time) })),
    rows: rows.filter((r) => r.homePlayerId || r.awayPlayerId),
  });

  const site = typeof window !== "undefined" ? window.location.origin : "https://www.necobbd.com";
  const detailsUrl = `${site}/matches/${fixtureId}`;
  const text = useMemo(() => {
    if (!f) return "";
    const capName = (id: string, def: string) => players.get(id || def)?.fullName;
    return buildMatchText({
      tournament: sheet.tournament?.name || f.tournamentName || "",
      round: f.round,
      home: f.homeClub || { name: "Home" },
      away: f.awayClub || { name: "Away" },
      scheduledDate: f.scheduledDate,
      lineup: filled.length
        ? {
            minutes,
            slots: slots.map((s) => ({ ...s, time: fromLocalInput(s.time) || f.scheduledDate })),
            rows: filled.map((r) => ({ ...r, homePlayer: players.get(r.homePlayerId), awayPlayer: players.get(r.awayPlayerId) })),
          }
        : null,
      counts: { remaining: f.result?.status === "APPROVED" ? 0 : filled.length || sheet.playersPerTie, homeWins: 0, awayWins: 0 },
      captains: { home: capName(homeCap, sheet.captains.homeDefault), away: capName(awayCap, sheet.captains.awayDefault) },
      judge,
      detailsUrl,
      rulesUrl: `${site}/rules`,
    });
  }, [f, sheet, slots, rows, minutes, judge, homeCap, awayCap, players, detailsUrl, site, filled]);

  const captainMsg = f
    ? `🔐 ${f.homeClub?.name} vs ${f.awayClub?.name}\nMatch code: ${sheet.matchCode}\nOpen ${detailsUrl} → "Captain area", enter the code to see the match group, players' WhatsApp and submit the result.\nKeep this code inside the two clubs only.`
    : "";

  return (
    <Modal open onClose={onClose} title="Match setup" wide>
      {err ? (
        <Notice kind="err">{err}</Notice>
      ) : !sheet ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-[#0F1012] text-white">
            <ClubLogo club={f.homeClub} size={30} />
            <span className="text-xs font-black truncate">{f.homeClub?.name}</span>
            <span className="text-[10px] font-black text-amber-400">VS</span>
            <span className="text-xs font-black truncate">{f.awayClub?.name}</span>
            <ClubLogo club={f.awayClub} size={30} />
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
            {(
              [
                ["schedule", "Schedule & captains", CalendarClock],
                ["lineup", `Lineup (${filled.length})`, ListOrdered],
                ["code", "Code & text", KeyRound],
              ] as const
            ).map(([k, label, Icon]) => (
              <button key={k} onClick={() => setTab(k)} className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-black ${tab === k ? "bg-white shadow text-black" : "text-slate-500"}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {tab === "schedule" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">Match date & time</span>
                  <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} disabled={f.result?.status === "APPROVED"} />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">Match operations (judge)</span>
                  <input value={judge} onChange={(e) => setJudge(e.target.value)} placeholder="e.g. M H Maruf, Jubaer Mubin" className={inputCls} />
                </label>
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-slate-700">Match group link (Messenger)</span>
                  <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://m.me/j/…" className={inputCls} />
                  <span className="block text-[10px] text-slate-400">Shown on the match page only to people who enter the match code.</span>
                </label>
                {(
                  [
                    ["Home captain", f.homeClub?.name, homeCap, setHomeCap, sheet.homeSquad, sheet.captains.homeDefault],
                    ["Away captain", f.awayClub?.name, awayCap, setAwayCap, sheet.awaySquad, sheet.captains.awayDefault],
                  ] as const
                ).map(([label, club, val, setVal, squad, def]) => (
                  <label key={label} className="block space-y-1">
                    <span className="text-xs font-bold text-slate-700">
                      <Users className="w-3.5 h-3.5 inline -mt-0.5" /> {label} · {club}
                    </span>
                    <select value={val} onChange={(e) => setVal(e.target.value)} className={inputCls}>
                      <option value="">Club captain{def ? ` (${players.get(def)?.fullName || "set"})` : " (none set)"}</option>
                      {squad.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    save(
                      { ...(f.result?.status === "APPROVED" ? {} : { scheduledDate: fromLocalInput(date) }), judge, groupLink: link, homeCaptainId: homeCap, awayCaptainId: awayCap },
                      "Match details saved"
                    )
                  }
                  disabled={busy}
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
                </Button>
              </div>
            </div>
          )}

          {tab === "lineup" && (
            <div className="space-y-4">
              {/* Slots */}
              <div className="rounded-2xl border border-slate-200 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Time slots</span>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      Minutes per game
                      <input value={minutes} onChange={(e) => setMinutes(Math.max(1, Math.min(120, Number(e.target.value.replace(/\D/g, "")) || 1)))} className="w-12 px-2 py-1 rounded-lg border border-slate-200 text-center font-mono" />
                    </label>
                    <Button
                      small
                      variant="secondary"
                      onClick={() => {
                        const last = slots[slots.length - 1];
                        const d = new Date(last?.time || date);
                        d.setDate(d.getDate() + 1);
                        setSlots((s) => [...s, { id: `s${Date.now().toString(36)}`, label: `Day ${s.length + 1}`, time: toLocalInput(d.toISOString()) }]);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Slot
                    </Button>
                  </div>
                </div>
                {slots.map((s, i) => (
                  <div key={s.id} className="flex gap-2 items-center">
                    <span className="w-6 text-[10px] font-black text-slate-400">#{i + 1}</span>
                    <input value={s.label} onChange={(e) => setSlots((x) => x.map((y) => (y.id === s.id ? { ...y, label: e.target.value } : y)))} placeholder="e.g. 1st Day Late Night" className={`${inputCls} flex-1`} />
                    <input type="datetime-local" value={s.time} onChange={(e) => setSlots((x) => x.map((y) => (y.id === s.id ? { ...y, time: e.target.value } : y)))} className={`${inputCls} w-52`} />
                    <button
                      disabled={slots.length === 1}
                      onClick={() => {
                        setSlots((x) => x.filter((y) => y.id !== s.id));
                        setRows((rs) => rs.map((r) => (r.slotId === s.id ? { ...r, slotId: slots[0].id === s.id ? slots[1]?.id : slots[0].id } : r)));
                      }}
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Pairs */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">1v1 pairs · 🔑 = room host</span>
                <div className="flex gap-1.5">
                  <Button
                    small
                    variant="secondary"
                    onClick={() =>
                      setRows((rs) =>
                        rs.map((r, i) => ({ ...r, homePlayerId: r.homePlayerId || sheet.homeSquad[i]?.id || "", awayPlayerId: r.awayPlayerId || sheet.awaySquad[i]?.id || "" }))
                      )
                    }
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Fill by squad order
                  </Button>
                  <Button
                    small
                    variant="secondary"
                    onClick={() => {
                      // Spread the pairs evenly over the slots, in order.
                      const per = Math.ceil(rows.length / slots.length);
                      setRows((rs) => rs.map((r, i) => ({ ...r, slotId: slots[Math.min(slots.length - 1, Math.floor(i / per))].id })));
                    }}
                  >
                    Spread over slots
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-[18px_1fr_auto_1fr_120px] items-center gap-1.5 p-1.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-400 text-center">{i + 1}</span>
                    <select value={r.homePlayerId} onChange={(e) => setRow(i, { homePlayerId: e.target.value })} className={`${inputCls} !py-1.5`}>
                      <option value="">Home player…</option>
                      {sheet.homeSquad.map((p: any) => (
                        <option key={p.id} value={p.id} disabled={usedH.has(p.id) && r.homePlayerId !== p.id}>
                          {p.fullName}
                        </option>
                      ))}
                    </select>
                    <div className="flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-black">
                      {(["HOME", "", "AWAY"] as const).map((h) => (
                        <button key={h || "none"} onClick={() => setRow(i, { host: h })} title={h ? `${h === "HOME" ? "Home" : "Away"} player hosts the room` : "No host set"} className={`px-1.5 py-1 rounded-md ${r.host === h ? "bg-white shadow" : "text-slate-400"}`}>
                          {h === "HOME" ? "🔑◀" : h === "AWAY" ? "▶🔑" : "–"}
                        </button>
                      ))}
                    </div>
                    <select value={r.awayPlayerId} onChange={(e) => setRow(i, { awayPlayerId: e.target.value })} className={`${inputCls} !py-1.5`}>
                      <option value="">Away player…</option>
                      {sheet.awaySquad.map((p: any) => (
                        <option key={p.id} value={p.id} disabled={usedA.has(p.id) && r.awayPlayerId !== p.id}>
                          {p.fullName}
                        </option>
                      ))}
                    </select>
                    <select value={r.slotId} onChange={(e) => setRow(i, { slotId: e.target.value })} className={`${inputCls} !py-1.5`}>
                      {slots.map((s, k) => (
                        <option key={s.id} value={s.id}>
                          {s.label || `Slot ${k + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <Button variant="ghost" small onClick={() => setRows((rs) => [...rs, { homePlayerId: "", awayPlayerId: "", host: "", slotId: slots[0].id }])}>
                  <Plus className="w-3.5 h-3.5" /> Add pair
                </Button>
                <div className="flex gap-2">
                  {sheet.lineup && (
                    <Button variant="secondary" onClick={() => save({ lineup: null }, "Lineup cleared")} disabled={busy}>
                      Clear lineup
                    </Button>
                  )}
                  <Button onClick={() => save({ lineup: lineupJson() }, "Lineup saved")} disabled={busy || !filled.length}>
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save lineup
                  </Button>
                </div>
              </div>
            </div>
          )}

          {tab === "code" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-[#0F1012] to-zinc-800 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Match code</div>
                  <div className="font-mono text-4xl font-black tracking-[0.3em] mt-1">{sheet.matchCode}</div>
                  <div className="text-[11px] text-white/60 mt-1">Give it to the two captains only. With it they see the match group, players&apos; WhatsApp and can submit the result.</div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => copy(captainMsg, "Code message")} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-black">
                    <Copy className="w-3.5 h-3.5" /> Copy for captains
                  </button>
                  <button
                    onClick={async () => {
                      if (!(await confirmDialog({ title: "Make a new code?", text: "The old code stops working right away. Send the new one to both captains.", confirmText: "New code", danger: true }))) return;
                      save({ newCode: true }, "New code made");
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-xs font-bold hover:bg-white/20"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> New code
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-600">Match page:</span>
                <a href={detailsUrl} target="_blank" rel="noreferrer" className="font-mono text-blue-700 hover:underline truncate">
                  {detailsUrl}
                </a>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Group announcement (auto)</span>
                  <Button small onClick={() => copy(text, "Announcement")}>
                    <Copy className="w-3.5 h-3.5" /> Copy text
                  </Button>
                </div>
                <textarea readOnly value={text} rows={14} className={`${inputCls} font-mono !text-[11px] leading-relaxed`} />
                <p className="text-[10px] text-slate-400">Built from the lineup tab (save it first). Score counts update after the result is approved.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
