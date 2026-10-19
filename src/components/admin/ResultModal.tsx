"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api, Button, Field, inputCls, Modal, Notice } from "./ui";

/** Official result entry: finalises the match and updates ratings/stats. */
export function ResultModal({ fixture, onClose, onDone }: { fixture: any; onClose: () => void; onDone: () => void }) {
  const initial = fixture.result?.status === "PENDING" ? fixture.result : fixture.status === "LIVE" ? { homeScore: fixture.liveScore.home, awayScore: fixture.liveScore.away } : { homeScore: 0, awayScore: 0 };
  const [home, setHome] = useState(String(initial.homeScore ?? 0));
  const [away, setAway] = useState(String(initial.awayScore ?? 0));
  const [hp, setHp] = useState("");
  const [ap, setAp] = useState("");
  const [motm, setMotm] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState(fixture.result?.notes || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const homeName = fixture.homePlayer?.fullName || fixture.homeClub?.name || "Home";
  const awayName = fixture.awayPlayer?.fullName || fixture.awayClub?.name || "Away";
  const draw = home === away;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api(`/api/admin/fixtures/${fixture.id}`, {
        method: "PATCH",
        json: {
          action: "APPROVE",
          homeScore: Number(home),
          awayScore: Number(away),
          homePenalties: draw && hp !== "" ? Number(hp) : null,
          awayPenalties: draw && ap !== "" ? Number(ap) : null,
          motmPlayerId: motm,
          motmReason: reason,
          notes,
          proofScreenshot: fixture.result?.proofScreenshot || "",
        },
      });
      onDone();
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Final result">
      <form onSubmit={submit} className="space-y-3">
        {err && <Notice kind="err">{err}</Notice>}
        {fixture.result?.status === "PENDING" && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            Reported by a player: <strong>{fixture.result.homeScore} - {fixture.result.awayScore}</strong>
            {fixture.result.proofScreenshot && (
              <a href={fixture.result.proofScreenshot} target="_blank" rel="noopener noreferrer" className="block mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fixture.result.proofScreenshot} alt="Proof" className="rounded-lg border border-amber-200 max-h-48" />
              </a>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label={`${homeName} goals`}>
            <input type="number" min={0} max={99} className={`${inputCls} text-lg font-black font-mono`} value={home} onChange={(e) => setHome(e.target.value)} required />
          </Field>
          <Field label={`${awayName} goals`}>
            <input type="number" min={0} max={99} className={`${inputCls} text-lg font-black font-mono`} value={away} onChange={(e) => setAway(e.target.value)} required />
          </Field>
          {draw && (
            <>
              <Field label="Home penalties (optional)">
                <input type="number" min={0} max={99} className={inputCls} value={hp} onChange={(e) => setHp(e.target.value)} />
              </Field>
              <Field label="Away penalties (optional)">
                <input type="number" min={0} max={99} className={inputCls} value={ap} onChange={(e) => setAp(e.target.value)} />
              </Field>
            </>
          )}
        </div>
        {(fixture.homePlayer || fixture.awayPlayer) && (
          <Field label="Man of the Match">
            <select className={inputCls} value={motm} onChange={(e) => setMotm(e.target.value)}>
              <option value="">None</option>
              {fixture.homePlayer && <option value={fixture.homePlayer.id}>{fixture.homePlayer.fullName}</option>}
              {fixture.awayPlayer && <option value={fixture.awayPlayer.id}>{fixture.awayPlayer.fullName}</option>}
            </select>
          </Field>
        )}
        {motm && (
          <Field label="MOTM reason">
            <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={250} />
          </Field>
        )}
        <Field label="Official notes (public)">
          <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
        </Field>
        <p className="text-[11px] text-slate-500">Approving finalises the match: ratings, stats, form and market values update immediately and cannot be re-applied.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={busy}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Approve result
          </Button>
        </div>
      </form>
    </Modal>
  );
}
