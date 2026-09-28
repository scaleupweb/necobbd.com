"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Play, Pause, Ban, CheckCircle2, Trash2, XCircle, Pencil, Loader2, ExternalLink, RotateCcw } from "lucide-react";
import { api, Badge, Button, Empty, Field, inputCls, Modal, Notice, PageHeader, statusTone, Toggle, toLocalInput, fromLocalInput } from "@/components/admin/ui";
import { ResultModal } from "@/components/admin/ResultModal";
import { formatDate, formatTime } from "@/lib/utils";

export default function AdminFixturesPage() {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [referees, setReferees] = useState<any[]>([]);
  const [status, setStatus] = useState("ALL");
  const [tournamentId, setTournamentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [resultFor, setResultFor] = useState<any>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tournament");
    if (t) setTournamentId(t);
    Promise.all([
      api<any[]>("/api/admin/resources/tournaments").catch(() => []),
      fetch("/api/players?status=ACTIVE", { cache: "no-store" }).then((r) => r.json()).then((j) => j.data || []),
      api<any[]>("/api/clubs").catch(() => []),
      api<any[]>("/api/admin/referees").catch(() => []),
    ]).then(([t, p, c, r]) => {
      setTournaments(t);
      setPlayers(p);
      setClubs(c);
      setReferees(r);
    });
  }, []);

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (status !== "ALL") qs.set("status", status);
    if (tournamentId) qs.set("tournamentId", tournamentId);
    try {
      setFixtures(await api(`/api/admin/fixtures?${qs}`));
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setLoading(false);
    }
  }, [status, tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (f: any, action: string, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    setMsg(null);
    try {
      await api(`/api/admin/fixtures/${f.id}`, { method: "PATCH", json: { action } });
      load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  };

  const remove = async (f: any) => {
    if (!confirm("Delete this fixture?")) return;
    try {
      await api(`/api/admin/fixtures/${f.id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  };

  const pending = fixtures.filter((f) => f.result?.status === "PENDING");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fixtures & Results"
        subtitle="Schedule matches, run them live and approve final scores. Approved results update ratings automatically."
        actions={
          <Button onClick={() => setEditing({})}>
            <Plus className="w-4 h-4" /> New fixture
          </Button>
        }
      />

      {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}

      {pending.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2">
          <div className="text-sm font-black text-amber-900">{pending.length} player-reported result(s) need review</div>
          {pending.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white rounded-xl border border-amber-200 p-3">
              <span className="font-bold">
                {name(f, "home")} {f.result.homeScore} - {f.result.awayScore} {name(f, "away")}
              </span>
              <div className="flex gap-1.5">
                <Button small variant="success" onClick={() => setResultFor(f)}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Review & approve
                </Button>
                <Button small variant="secondary" onClick={() => act(f, "REJECT_CLAIM", "Reject this reported score?")}>
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <select className={`${inputCls} sm:w-56`} value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
          <option value="">All tournaments</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select className={`${inputCls} sm:w-44`} value={status} onChange={(e) => setStatus(e.target.value)}>
          {["ALL", "SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" />
        </div>
      ) : fixtures.length === 0 ? (
        <Empty>No fixtures found. Click “New fixture” to schedule a match.</Empty>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Match</th>
                  <th className="py-2.5 px-3">When</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixtures.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 min-w-[240px]">
                      <div className="font-bold text-slate-950">
                        {name(f, "home")} vs {name(f, "away")}
                      </div>
                      <div className="text-slate-500">{[f.tournamentName, f.round, f.referee?.name && `Ref: ${f.referee.name}`].filter(Boolean).join(" · ")}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {formatDate(f.scheduledDate)}
                      <div className="text-slate-500">{formatTime(f.scheduledDate)}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-black">
                      {f.status === "LIVE" ? `${f.liveScore.home} - ${f.liveScore.away}` : f.status === "FINISHED" && f.result ? `${f.result.homeScore} - ${f.result.awayScore}` : "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge tone={statusTone(f.status)}>{f.status === "LIVE" ? `LIVE ${f.minute}` : f.status}</Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex justify-end gap-1.5 flex-nowrap whitespace-nowrap">
                        {(f.status === "SCHEDULED" || f.status === "POSTPONED") && (
                          <Button small variant="success" onClick={() => act(f, "START")} title="Start match (go live)">
                            <Play className="w-3.5 h-3.5" /> Start
                          </Button>
                        )}
                        {f.status === "LIVE" && (
                          <Button small variant="secondary" onClick={() => act(f, "RESET", "Stop the live match and return it to scheduled?")} title="Stop live">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {f.status !== "FINISHED" && f.status !== "CANCELLED" && (
                          <Button small onClick={() => setResultFor(f)} title="Enter final result">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Result
                          </Button>
                        )}
                        {f.status === "SCHEDULED" && (
                          <Button small variant="secondary" onClick={() => act(f, "POSTPONE")} title="Postpone">
                            <Pause className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {f.status !== "FINISHED" && f.status !== "CANCELLED" && (
                          <Button small variant="secondary" onClick={() => act(f, "CANCEL", "Cancel this match?")} title="Cancel">
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {f.status !== "FINISHED" && (
                          <Button small variant="secondary" onClick={() => setEditing(f)} title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Link href={`/matches/${f.id}`} target="_blank" className="inline-flex items-center px-2 py-1.5 text-slate-500 hover:text-black" title="Open match page">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {f.status !== "FINISHED" && (
                          <Button small variant="ghost" onClick={() => remove(f)} title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <FixtureForm
          fixture={editing}
          tournaments={tournaments}
          players={players}
          clubs={clubs}
          referees={referees}
          defaultTournament={tournamentId}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {resultFor && <ResultModal fixture={resultFor} onClose={() => setResultFor(null)} onDone={load} />}
    </div>
  );
}

function name(f: any, side: "home" | "away") {
  return f[`${side}Player`]?.fullName || f[`${side}Club`]?.name || "TBD";
}

function FixtureForm({ fixture, tournaments, players, clubs, referees, defaultTournament, onClose, onSaved }: any) {
  const isEdit = !!fixture.id;
  const [mode, setMode] = useState<"players" | "clubs">(fixture.homeClub && !fixture.homePlayer ? "clubs" : "players");
  const [f, setF] = useState({
    tournamentId: fixture.tournamentId || defaultTournament || "",
    round: fixture.round || "Round 1",
    scheduledDate: toLocalInput(fixture.scheduledDate),
    venue: fixture.venue || "Online",
    homePlayerId: fixture.homePlayer?.id || "",
    awayPlayerId: fixture.awayPlayer?.id || "",
    homeClubId: fixture.homeClub?.id || "",
    awayClubId: fixture.awayClub?.id || "",
    refereeId: fixture.referee?.id || "",
    isOnStream: !!fixture.isOnStream,
    streamUrl: fixture.streamUrl || "",
    streamPlatform: fixture.streamPlatform || "",
  });
  const [participantIds, setParticipantIds] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // When a tournament is picked, suggest only its registered players.
  useEffect(() => {
    if (!f.tournamentId) {
      setParticipantIds(null);
      return;
    }
    api<any[]>(`/api/admin/tournaments/${f.tournamentId}/participants`)
      .then((list) => setParticipantIds(new Set(list.filter((p) => p.status !== "REMOVED").map((p) => p.playerId))))
      .catch(() => setParticipantIds(null));
  }, [f.tournamentId]);

  const playerOptions = useMemo(() => (participantIds && participantIds.size ? players.filter((p: any) => participantIds.has(p.id)) : players), [players, participantIds]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const body: any = {
        tournamentId: f.tournamentId,
        round: f.round,
        scheduledDate: fromLocalInput(f.scheduledDate),
        venue: f.venue,
        refereeId: f.refereeId,
        isOnStream: f.isOnStream,
        streamUrl: f.streamUrl,
        streamPlatform: f.streamPlatform,
        homePlayerId: mode === "players" ? f.homePlayerId : "",
        awayPlayerId: mode === "players" ? f.awayPlayerId : "",
        homeClubId: mode === "clubs" ? f.homeClubId : "",
        awayClubId: mode === "clubs" ? f.awayClubId : "",
      };
      if (isEdit) await api(`/api/admin/fixtures/${fixture.id}`, { method: "PATCH", json: { action: "UPDATE", ...body } });
      else await api("/api/admin/fixtures", { method: "POST", json: body });
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const sel = (key: string, list: any[], label: (x: any) => string) => (
    <select className={inputCls} value={(f as any)[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} required>
      <option value="">Select…</option>
      {list.map((x) => (
        <option key={x.id} value={x.id}>
          {label(x)}
        </option>
      ))}
    </select>
  );

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit fixture" : "New fixture"} wide>
      <form onSubmit={submit} className="space-y-4">
        {err && <Notice kind="err">{err}</Notice>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Tournament">
            <select className={inputCls} value={f.tournamentId} onChange={(e) => setF({ ...f, tournamentId: e.target.value })}>
              <option value="">Friendly / no tournament</option>
              {tournaments.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Round / stage">
            <input className={inputCls} value={f.round} onChange={(e) => setF({ ...f, round: e.target.value })} placeholder="Quarter-final, Group A, Round 1…" />
          </Field>
          <Field label="Kick-off *">
            <input type="datetime-local" className={inputCls} value={f.scheduledDate} onChange={(e) => setF({ ...f, scheduledDate: e.target.value })} required />
          </Field>
          <Field label="Venue">
            <input className={inputCls} value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })} />
          </Field>
        </div>

        <div className="flex gap-2">
          {(["players", "clubs"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${mode === m ? "bg-black text-white" : "bg-slate-100"}`}>
              {m === "players" ? "Player vs Player" : "Club vs Club"}
            </button>
          ))}
        </div>
        {mode === "players" && participantIds && participantIds.size > 0 && <p className="text-[11px] text-slate-500">Showing only players registered in this tournament.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mode === "players" ? (
            <>
              <Field label="Home player *">{sel("homePlayerId", playerOptions, (p) => `${p.fullName} (@${p.username})`)}</Field>
              <Field label="Away player *">{sel("awayPlayerId", playerOptions.filter((p: any) => p.id !== f.homePlayerId), (p) => `${p.fullName} (@${p.username})`)}</Field>
            </>
          ) : (
            <>
              <Field label="Home club *">{sel("homeClubId", clubs, (c) => c.name)}</Field>
              <Field label="Away club *">{sel("awayClubId", clubs.filter((c: any) => c.id !== f.homeClubId), (c) => c.name)}</Field>
            </>
          )}
          <Field label="Referee">
            <select className={inputCls} value={f.refereeId} onChange={(e) => setF({ ...f, refereeId: e.target.value })}>
              <option value="">Not assigned</option>
              {referees.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.tier.replace("_", " ")})
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end pb-1">
            <Toggle checked={f.isOnStream} onChange={(v) => setF({ ...f, isOnStream: v })} label="Live-streamed" />
          </div>
          {f.isOnStream && (
            <>
              <Field label="Stream URL">
                <input className={inputCls} value={f.streamUrl} onChange={(e) => setF({ ...f, streamUrl: e.target.value })} placeholder="https://youtube.com/…" />
              </Field>
              <Field label="Platform">
                <input className={inputCls} value={f.streamPlatform} onChange={(e) => setF({ ...f, streamPlatform: e.target.value })} placeholder="YouTube, Facebook…" />
              </Field>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {isEdit ? "Save" : "Create fixture"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
