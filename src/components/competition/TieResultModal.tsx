"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Wand2, RotateCcw, Check, Star, Plus, Minus, Lock, Pencil } from "lucide-react";
import { api, Button, Modal, Notice, inputCls } from "@/components/admin/ui";
import { toast, confirmDialog } from "@/lib/feedback";
import { scoreGames } from "@/lib/competition";
import { ClubLogo, GamesList } from "./views";

type Row = { homePlayerId: string; awayPlayerId: string; homeGoals: string; awayGoals: string };
const emptyRow = (): Row => ({ homePlayerId: "", awayPlayerId: "", homeGoals: "", awayGoals: "" });

/** Enter a club-vs-club result game by game (or view / roll back an approved one). */
export function TieResultModal({ fixtureId, lockReason, onClose, onDone }: { fixtureId: string; lockReason?: string; onClose: () => void; onDone: () => void }) {
  const [sheet, setSheet] = useState<any>(null);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [motm, setMotm] = useState("");
  const [decider, setDecider] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  /** Load the sheet; `prefill` (an old result) fills the form so a mistake can be corrected. */
  const load = (prefill?: any) =>
    api(`/api/admin/fixtures/${fixtureId}/tie`)
      .then((d) => {
        setSheet(d);
        const old = (prefill?.games || []).map((g: any) => ({
          homePlayerId: g.homePlayer?.id || "",
          awayPlayerId: g.awayPlayer?.id || "",
          homeGoals: String(g.homeGoals ?? ""),
          awayGoals: String(g.awayGoals ?? ""),
        }));
        // Nothing to edit: start from what the captains submitted, or from the lineup's pairs.
        let start = old;
        if (!prefill && d.fixture?.result?.status !== "APPROVED") {
          if (d.claim?.games?.length)
            start = d.claim.games.map((g: any) => ({ homePlayerId: g.homePlayerId, awayPlayerId: g.awayPlayerId, homeGoals: String(g.homeGoals), awayGoals: String(g.awayGoals) }));
          else if (d.lineup?.rows?.length)
            start = d.lineup.rows.filter((r: any) => r.homePlayerId && r.awayPlayerId).map((r: any) => ({ homePlayerId: r.homePlayerId, awayPlayerId: r.awayPlayerId, homeGoals: "", awayGoals: "" }));
          if (d.claim?.notes) setNotes(d.claim.notes);
        }
        setRows([...start, ...Array.from({ length: Math.max(0, d.playersPerTie - start.length) }, emptyRow)]);
        if (prefill) {
          setMotm(prefill.result?.motmPlayerId || "");
          setDecider(prefill.result?.decider || "");
          setNotes(prefill.result?.notes || "");
        }
      })
      .catch((e) => setErr(e.message));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureId]);

  const f = sheet?.fixture;
  const approved = f?.result?.status === "APPROVED";
  // A game counts once both players and both scores are filled in.
  const isComplete = (r: Row) => !!(r.homePlayerId && r.awayPlayerId && r.homeGoals !== "" && r.awayGoals !== "");
  const complete = rows.filter(isComplete);
  const partial = rows.filter((r) => (r.homePlayerId || r.awayPlayerId || r.homeGoals || r.awayGoals) && !isComplete(r)).length;
  const score = useMemo(
    () => scoreGames(complete.map((r) => ({ homeGoals: Number(r.homeGoals) || 0, awayGoals: Number(r.awayGoals) || 0 }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows]
  );
  const usedHome = new Set(rows.map((r) => r.homePlayerId).filter(Boolean));
  const usedAway = new Set(rows.map((r) => r.awayPlayerId).filter(Boolean));
  const players = useMemo(() => new Map<string, any>([...(sheet?.homeSquad || []), ...(sheet?.awaySquad || [])].map((p: any) => [p.id, p])), [sheet]);

  const set = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const autoPair = () =>
    setRows((rs) =>
      rs.map((r, i) => ({
        ...r,
        homePlayerId: r.homePlayerId || sheet.homeSquad[i]?.id || "",
        awayPlayerId: r.awayPlayerId || sheet.awaySquad[i]?.id || "",
      }))
    );

  const submit = async () => {
    if (!complete.length) return toast.error("Add at least one game (both players)");
    if (partial) return toast.error(`${partial} game(s) are missing a player or a score. Fill them in or clear them.`);
    const hc = f.homeClub?.name;
    const ac = f.awayClub?.name;
    if (!(await confirmDialog({ title: "Approve this result?", text: `${hc} ${score.homePoints} - ${score.awayPoints} ${ac} (${complete.length} games). Player ratings and club tables update right away.`, confirmText: "Approve" }))) return;
    setBusy(true);
    try {
      await api(`/api/admin/fixtures/${fixtureId}/tie`, {
        method: "POST",
        json: {
          games: complete.map((r) => ({ homePlayerId: r.homePlayerId, awayPlayerId: r.awayPlayerId, homeGoals: Number(r.homeGoals) || 0, awayGoals: Number(r.awayGoals) || 0 })),
          motmPlayerId: motm || undefined,
          decider: decider || undefined,
          notes,
        },
      });
      toast.success("Result approved");
      onDone();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const rollback = async (edit: boolean) => {
    const ok = await confirmDialog(
      edit
        ? { title: "Edit this result?", text: "The result is taken back (ratings, records and club stats are reversed) and the form opens with the old games filled in. Fix what's wrong and approve again.", confirmText: "Edit result" }
        : { title: "Roll back this result?", text: "Player ratings, records and club stats from this match are reversed. The match goes back to not played.", confirmText: "Roll back", danger: true }
    );
    if (!ok) return;
    const before = f;
    setBusy(true);
    try {
      await api(`/api/admin/fixtures/${fixtureId}/tie`, { method: "DELETE" });
      toast.success(edit ? "Result opened for editing" : "Result rolled back");
      onDone();
      await load(edit ? before : undefined);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const hp = approved ? f.result.homeScore : score.homePoints;
  const ap = approved ? f.result.awayScore : score.awayPoints;
  const hg = approved ? f.result.homeGoals : score.homeGoals;
  const ag = approved ? f.result.awayGoals : score.awayGoals;

  return (
    <Modal open onClose={onClose} title={f ? `${f.round}` : "Match result"} wide>
      {err ? (
        <Notice kind="err">{err}</Notice>
      ) : !sheet ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Scoreboard */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0F1012] to-zinc-800 text-white p-4 sm:p-5 ring-1 ring-amber-500/30">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
                <ClubLogo club={f.homeClub} size={48} />
                <span className="text-xs font-black truncate max-w-full">{f.homeClub?.name}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/50">Home</span>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl font-black tabular-nums">
                  <span className={hp > ap ? "text-amber-400" : ""}>{hp}</span>
                  <span className="text-white/30 mx-2">:</span>
                  <span className={ap > hp ? "text-amber-400" : ""}>{ap}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">Game points</div>
                <div className="text-[11px] font-mono text-white/70">
                  Goals {hg} - {ag}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
                <ClubLogo club={f.awayClub} size={48} />
                <span className="text-xs font-black truncate max-w-full">{f.awayClub?.name}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/50">Away</span>
              </div>
            </div>
            {approved && <div className="mt-3 text-center text-[11px] font-bold text-emerald-300">✓ Approved</div>}
          </div>

          {!approved && sheet.claim && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-black">Submitted with the match code{sheet.claim.by ? ` by ${sheet.claim.by}` : ""} · {new Date(sheet.claim.at).toLocaleString()}</div>
              <div>The games below are filled in from it. Check the proof, fix anything wrong, then approve.</div>
              {sheet.claim.proof && (
                <a href={sheet.claim.proof} target="_blank" rel="noopener noreferrer nofollow" className="inline-block font-bold text-blue-700 underline break-all">
                  Open proof
                </a>
              )}
            </div>
          )}
          {approved ? (
            <>
              <GamesList games={f.games} motmId={f.result.motmPlayerId} />
              {f.result.notes && <p className="text-xs text-slate-600 whitespace-pre-line">{f.result.notes}</p>}
              {lockReason ? (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-600">
                    <Lock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Locked: {lockReason}.
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="secondary" onClick={() => rollback(false)} disabled={busy}>
                    <RotateCcw className="w-3.5 h-3.5" /> Roll back
                  </Button>
                  <Button onClick={() => rollback(true)} disabled={busy}>
                    <Pencil className="w-3.5 h-3.5" /> Edit result
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500">
                  Each game: win = 3 points, draw = 1 each. The club with more points wins the match. Tap a game number to clear it.
                </p>
                <div className="flex gap-1.5">
                  <Button small variant="secondary" onClick={autoPair} title="Fill empty rows with both squads in order">
                    <Wand2 className="w-3.5 h-3.5" /> Auto-pair
                  </Button>
                  <Button small variant="ghost" onClick={() => setRows((r) => (r.length > 1 ? r.slice(0, -1) : r))} title="One game less">
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Button small variant="ghost" onClick={() => setRows((r) => (r.length < 30 ? [...r, emptyRow()] : r))} title="One game more">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                {rows.map((r, i) => {
                  const both = isComplete(r);
                  const h = Number(r.homeGoals) || 0;
                  const a = Number(r.awayGoals) || 0;
                  const tone = !both ? "border-slate-200" : h > a ? "border-l-4 border-l-emerald-500 border-slate-200" : a > h ? "border-r-4 border-r-sky-500 border-slate-200" : "border-slate-300 bg-slate-50";
                  return (
                    <div key={i} className={`grid grid-cols-[18px_1fr_46px_10px_46px_1fr] items-center gap-1.5 p-1.5 rounded-xl border ${tone}`}>
                      <button type="button" onClick={() => set(i, emptyRow())} title="Clear this game" className="text-[10px] font-mono text-slate-400 text-center rounded hover:bg-rose-50 hover:text-rose-600">
                        {i + 1}
                      </button>
                      <select value={r.homePlayerId} onChange={(e) => set(i, { homePlayerId: e.target.value })} className={`${inputCls} !py-1.5`}>
                        <option value="">Home player…</option>
                        {sheet.homeSquad.map((p: any) => (
                          <option key={p.id} value={p.id} disabled={usedHome.has(p.id) && r.homePlayerId !== p.id}>
                            {p.fullName}
                          </option>
                        ))}
                      </select>
                      <input inputMode="numeric" value={r.homeGoals} onChange={(e) => set(i, { homeGoals: e.target.value.replace(/\D/g, "").slice(0, 2) })} placeholder="0" className={`${inputCls} !py-1.5 text-center font-mono font-black`} />
                      <span className="text-center text-slate-400 font-black">:</span>
                      <input inputMode="numeric" value={r.awayGoals} onChange={(e) => set(i, { awayGoals: e.target.value.replace(/\D/g, "").slice(0, 2) })} placeholder="0" className={`${inputCls} !py-1.5 text-center font-mono font-black`} />
                      <select value={r.awayPlayerId} onChange={(e) => set(i, { awayPlayerId: e.target.value })} className={`${inputCls} !py-1.5`}>
                        <option value="">Away player…</option>
                        {sheet.awaySquad.map((p: any) => (
                          <option key={p.id} value={p.id} disabled={usedAway.has(p.id) && r.awayPlayerId !== p.id}>
                            {p.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
              {(!sheet.homeSquad.length || !sheet.awaySquad.length) && <Notice kind="err">One of the clubs has no players in its squad.</Notice>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500" /> Man of the Match
                  </span>
                  <select value={motm} onChange={(e) => setMotm(e.target.value)} className={inputCls}>
                    <option value="">— none —</option>
                    {[...usedHome, ...usedAway].map((id) => (
                      <option key={id} value={id}>
                        {players.get(id)?.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                {f.stage === "KNOCKOUT" && (
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-slate-700">If the tie is level overall, winner is</span>
                    <select value={decider} onChange={(e) => setDecider(e.target.value)} className={inputCls}>
                      <option value="">— not needed —</option>
                      <option value={f.homeClub?.id}>{f.homeClub?.name}</option>
                      <option value={f.awayClub?.id}>{f.awayClub?.name}</option>
                    </select>
                    <span className="block text-[10px] text-slate-400">E.g. after a deciding game or penalties. Used only when points and goals are equal.</span>
                  </label>
                )}
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-slate-700">Notes (optional)</span>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} />
                </label>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-slate-500">
                  {complete.length} game{complete.length === 1 ? "" : "s"} ready{partial ? ` · ${partial} incomplete` : ""}
                </span>
                <Button variant="success" onClick={submit} disabled={busy || !complete.length}>
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve result
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
