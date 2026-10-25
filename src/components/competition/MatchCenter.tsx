"use client";

// Public page of a competition match: both clubs, captains, the 1v1 lineup, both squads and the captains' area
// (unlocked with the match code: match group, WhatsApp, submit the result).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Lock, Unlock, KeyRound, Crown, Users, Copy, Send, Loader2, CheckCircle2, Clock, Fingerprint, Smartphone, Swords } from "lucide-react";
import { buildMatchText } from "@/lib/match-text";
import { GamesList } from "./views";

const waLink = (phone: string) => {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("01")) d = "88" + d;
  return `https://wa.me/${d}`;
};
const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

function Logo({ club, size }: { club: any; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={club?.logo || "/images/placeholders/club.svg"} alt="" style={{ width: size, height: size }} className="rounded-full object-cover bg-black/40 ring-4 ring-white/10 shadow-2xl" />
  );
}

export function MatchCenter({ fixtureId }: { fixtureId: string }) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [side, setSide] = useState<"home" | "away">("home");
  const [code, setCode] = useState("");
  const [priv, setPriv] = useState<any>(null);
  const [unlocking, setUnlocking] = useState(false);

  const load = () =>
    fetch(`/api/matches/${fixtureId}/center`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => (j.success ? setData(j.data) : setErr(j.error?.message || "Match not found")))
      .catch(() => setErr("Could not load the match"));

  const unlock = async (c: string, quiet = false) => {
    setUnlocking(true);
    try {
      const j = await fetch(`/api/matches/${fixtureId}/center`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c }) }).then((r) => r.json());
      if (!j.success) throw new Error(j.error?.message || "Wrong code");
      setPriv(j.data);
      setCode(c.toUpperCase());
      try {
        sessionStorage.setItem(`match-code:${fixtureId}`, c.toUpperCase());
      } catch {}
    } catch (e: any) {
      if (!quiet) alert(e.message);
      try {
        sessionStorage.removeItem(`match-code:${fixtureId}`);
      } catch {}
    } finally {
      setUnlocking(false);
    }
  };

  useEffect(() => {
    load();
    let saved = "";
    try {
      saved = sessionStorage.getItem(`match-code:${fixtureId}`) || "";
    } catch {}
    if (saved) unlock(saved, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureId]);

  if (err) return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-sm font-bold text-slate-600">{err}</div>;
  if (!data)
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );

  const f = data.fixture;
  const approved = f.result?.status === "APPROVED";
  const due = !approved && new Date(f.scheduledDate).getTime() <= Date.now();
  const status = f.walkover ? "BYE · AUTO WIN" : approved ? "FINISHED" : f.status === "LIVE" ? "LIVE" : due ? "IN PROGRESS" : "UPCOMING";
  const squad = data.squads[side];
  const club = side === "home" ? f.homeClub : f.awayClub;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-[#0B0C0F] text-white">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(245,158,11,0.28),transparent_45%),radial-gradient(ellipse_at_85%_100%,rgba(139,92,246,0.3),transparent_50%)]" />
        <div className="relative p-5 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <Link href={data.tournament ? `/tournaments/${data.tournament.slug}` : "/tournaments"} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 text-[11px] font-black tracking-widest uppercase hover:bg-white/10">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <span className="px-3 py-2 rounded-xl border border-white/15 text-[10px] sm:text-[11px] font-black tracking-[0.2em] uppercase truncate max-w-[60%]">{data.tournament?.name}</span>
          </div>
          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            {[f.homeClub, null, f.awayClub].map((c, i) =>
              i === 1 ? (
                <div key="mid" className="flex flex-col items-center gap-2 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-[0.25em] border ${status === "LIVE" || status === "IN PROGRESS" ? "border-rose-400 text-rose-300" : approved ? "border-emerald-400 text-emerald-300" : "border-amber-400/60 text-amber-300"}`}>
                    {status}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.2em] uppercase">{fmt(f.scheduledDate)}</span>
                  {approved ? (
                    <div className="font-mono text-4xl sm:text-6xl font-black tabular-nums">
                      <span className={f.result.homeScore > f.result.awayScore ? "text-amber-400" : ""}>{f.result.homeScore}</span>
                      <span className="text-white/30 mx-2">:</span>
                      <span className={f.result.awayScore > f.result.homeScore ? "text-amber-400" : ""}>{f.result.awayScore}</span>
                    </div>
                  ) : (
                    <div className="text-4xl sm:text-5xl font-black italic text-white/80">VS</div>
                  )}
                  {approved && <span className="text-[10px] text-white/50 font-bold">Game points · goals {f.result.homeGoals ?? 0}-{f.result.awayGoals ?? 0}</span>}
                </div>
              ) : (
                <Link key={i} href={c?.slug ? `/clubs/${c.slug}` : "#"} className="flex flex-col items-center gap-3 text-center min-w-0">
                  <Logo club={c} size={96} />
                  <span className="text-sm sm:text-xl font-black uppercase tracking-tight line-clamp-2">{c?.name || "BYE"}</span>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* Match info */}
      <section className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap justify-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-black tracking-widest uppercase">{f.group ? `Group ${f.group}` : f.round}</span>
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black tracking-widest uppercase">{f.round}</span>
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border ${data.lineup ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-amber-300 text-amber-700 bg-amber-50"}`}>
            {data.lineup ? <Lock className="w-3 h-3" /> : <Clock className="w-3 h-3" />} {data.lineup ? "Lineup set" : "Lineup pending"}
          </span>
        </div>
        {priv?.groupLink ? (
          <a href={priv.groupLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-sm font-black tracking-[0.2em] uppercase shadow-lg hover:opacity-95">
            <MessageCircle className="w-5 h-5" /> Match group
          </a>
        ) : data.hasGroupLink ? (
          <a href="#captain-area" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-slate-100 text-slate-500 text-sm font-black tracking-[0.2em] uppercase">
            <Lock className="w-4 h-4" /> Match group · enter the match code
          </a>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["home", "away"] as const).map((k) => {
            const cap = data.captains[k];
            const c = k === "home" ? f.homeClub : f.awayClub;
            return (
              <div key={k} className={`flex items-center gap-3 p-3 rounded-2xl border ${k === "home" ? "bg-gradient-to-r from-amber-50 to-white border-amber-200" : "bg-gradient-to-r from-violet-50 to-white border-violet-200"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cap?.avatar || "/images/placeholders/avatar.svg"} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow" />
                <div className="min-w-0">
                  <div className={`text-[10px] font-black tracking-[0.2em] uppercase ${k === "home" ? "text-amber-700" : "text-violet-700"}`}>
                    <Crown className="w-3 h-3 inline -mt-0.5" /> {k} · team captain
                  </div>
                  <div className="text-sm font-black text-black truncate">{cap?.fullName || "Not set"}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{c?.shortName || c?.name}</div>
                </div>
              </div>
            );
          })}
        </div>
        {data.judge && <div className="text-center text-[11px] text-slate-500">👨‍⚖️ Match operations: <b className="text-slate-800">{data.judge}</b></div>}
      </section>

      {/* Lineup / results */}
      {(data.lineup || approved) && (
        <section className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Swords className="w-4 h-4" /> {approved ? "Results" : "Lineup"}
            </h2>
            <span className="text-[11px] font-bold text-slate-500">
              {approved ? `Wins ${data.counts.homeWins} – ${data.counts.awayWins}` : `${data.counts.remaining} games to play · 🔑 = room host`}
            </span>
          </div>
          {approved ? <GamesList games={f.games} motmId={f.result?.motmPlayerId} /> : <LineupView lineup={data.lineup} />}
        </section>
      )}

      {/* Squads */}
      {!f.walkover && (
        <section className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            {(["home", "away"] as const).map((k) => {
              const c = k === "home" ? f.homeClub : f.awayClub;
              const on = side === k;
              return (
                <button
                  key={k}
                  onClick={() => setSide(k)}
                  className={`text-left px-4 py-3 rounded-2xl transition-all ${on ? (k === "home" ? "bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg" : "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg") : "bg-slate-100 text-slate-600"}`}
                >
                  <div className="text-xs sm:text-sm font-black tracking-widest uppercase truncate">{c?.name}</div>
                  <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{data.squads[k].length} players</div>
                </button>
              );
            })}
          </div>
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {club?.shortName || club?.name} · squad
          </div>
          {squad.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {squad.map((p: any) => (
                <PlayerCard key={p.id} p={p} phone={priv?.phones?.[p.id]} isCaptain={data.captains[side]?.id === p.id} accent={side === "home" ? "amber" : "violet"} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No players in this squad.</p>
          )}
          {!priv && <p className="text-[10px] text-slate-400 text-center">WhatsApp numbers are shown to captains after entering the match code.</p>}
        </section>
      )}

      {/* Captain area */}
      {!f.walkover && (
        <section id="captain-area" className="scroll-mt-6 rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-4 bg-[#0B0C0F] text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center">{priv ? <Unlock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}</span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">For the two captains</div>
              <div className="text-base font-black">Captain area</div>
            </div>
          </div>
          <div className="p-5">
            {!priv ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (code.trim()) unlock(code.trim());
                }}
                className="flex flex-col sm:flex-row gap-2 max-w-md"
              >
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                  placeholder="MATCH CODE"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-black focus:outline-none font-mono text-lg font-black tracking-[0.35em] text-center uppercase"
                />
                <button disabled={unlocking || !code} className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-black text-white text-xs font-black disabled:opacity-50">
                  {unlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />} Unlock
                </button>
              </form>
            ) : (
              <CaptainTools data={data} priv={priv} code={code} onSubmitted={(c) => setPriv((p: any) => ({ ...p, claim: c }))} fixtureId={fixtureId} />
            )}
            {!priv && <p className="mt-2 text-[11px] text-slate-500">The admin gives the match code to both captains. It opens the match group, players&apos; WhatsApp and the result form.</p>}
          </div>
        </section>
      )}
    </div>
  );
}

function LineupView({ lineup }: { lineup: any }) {
  const slots = [...(lineup.slots || [])].sort((a: any, b: any) => +new Date(a.time) - +new Date(b.time));
  return (
    <div className="space-y-4">
      {slots.map((s: any, i: number) => {
        const rows = lineup.rows.filter((r: any) => r.slotId === s.id);
        if (!rows.length) return null;
        const end = new Date(new Date(s.time).getTime() + (lineup.minutes || 10) * 60000);
        return (
          <div key={s.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#0F1012] text-white text-[11px] font-black">{s.label || `Slot ${i + 1}`}</span>
              <span className="text-[11px] font-bold text-slate-500">
                {fmt(s.time)} – {end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
              <span className="flex-1 h-px bg-gradient-to-r from-amber-400/60 to-transparent" />
            </div>
            {rows.map((r: any, k: number) => (
              <div key={k} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-100">
                <PairSide p={r.homePlayer} host={r.host === "HOME"} />
                <span className="px-2 py-0.5 rounded-md bg-black text-amber-400 text-[10px] font-black">VS</span>
                <PairSide p={r.awayPlayer} host={r.host === "AWAY"} right />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function PairSide({ p, host, right }: { p: any; host: boolean; right?: boolean }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${right ? "flex-row-reverse text-right" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p?.avatar || "/images/placeholders/avatar.svg"} alt="" className="w-8 h-8 rounded-full object-cover bg-slate-200 shrink-0" />
      <span className="text-xs font-bold text-black truncate">{p?.fullName || "TBA"}</span>
      {host && <span title="Room host">🔑</span>}
    </div>
  );
}

function PlayerCard({ p, phone, isCaptain, accent }: { p: any; phone?: string; isCaptain: boolean; accent: "amber" | "violet" }) {
  return (
    <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#0F1012] text-white shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.avatar} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute top-2 left-2 flex gap-1">
        {p.seat ? <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] font-black">#{p.seat}</span> : null}
        {isCaptain && <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${accent === "amber" ? "bg-amber-500 text-black" : "bg-violet-600"}`}>C</span>}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-2.5 space-y-1">
        <Link href={`/players/${p.username}`} className="block text-xs sm:text-sm font-black uppercase leading-tight line-clamp-2 hover:underline">
          {p.fullName}
        </Link>
        {p.konamiId && (
          <div className="text-[9px] font-mono font-bold text-white/80 flex items-center gap-1">
            <Fingerprint className="w-3 h-3" /> {p.konamiId}
          </div>
        )}
        {p.deviceModel && (
          <div className="text-[9px] font-bold text-white/60 uppercase truncate flex items-center gap-1">
            <Smartphone className="w-3 h-3" /> {p.deviceModel}
          </div>
        )}
        <div className="flex gap-1.5 pt-1">
          {p.facebook && (
            <a href={p.facebook} target="_blank" rel="noopener noreferrer nofollow" title="Facebook" className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center text-[11px] font-black">
              f
            </a>
          )}
          {phone && (
            <a href={waLink(phone)} target="_blank" rel="noopener noreferrer" title={`WhatsApp ${phone}`} className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CaptainTools({ data, priv, code, fixtureId, onSubmitted }: { data: any; priv: any; code: string; fixtureId: string; onSubmitted: (claim: any) => void }) {
  const f = data.fixture;
  const approved = f.result?.status === "APPROVED";
  const pairs = useMemo(() => {
    const base = priv.claim?.games?.length
      ? priv.claim.games
      : data.lineup?.rows?.filter((r: any) => r.homePlayerId && r.awayPlayerId).map((r: any) => ({ homePlayerId: r.homePlayerId, awayPlayerId: r.awayPlayerId, homeGoals: "", awayGoals: "" })) || [];
    return base.length ? base : Array.from({ length: Math.min(data.squads.home.length, data.squads.away.length, data.counts.total || 10) }, () => ({ homePlayerId: "", awayPlayerId: "", homeGoals: "", awayGoals: "" }));
  }, [priv.claim, data]);
  const [rows, setRows] = useState<any[]>(pairs.map((g: any) => ({ ...g, homeGoals: String(g.homeGoals ?? ""), awayGoals: String(g.awayGoals ?? "") })));
  const [proof, setProof] = useState(priv.claim?.proof || "");
  const [by, setBy] = useState(priv.claim?.by || "");
  const [notes, setNotes] = useState(priv.claim?.notes || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const name = (id: string) => [...data.squads.home, ...data.squads.away].find((p: any) => p.id === id)?.fullName || "";
  const fixedPairs = !!data.lineup;
  const set = (i: number, k: string, v: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const text = buildMatchText({
    tournament: data.tournament?.name || "",
    round: f.round,
    home: f.homeClub,
    away: f.awayClub,
    scheduledDate: f.scheduledDate,
    lineup: data.lineup,
    counts: data.counts,
    captains: { home: data.captains.home?.fullName, away: data.captains.away?.fullName },
    judge: data.judge,
    detailsUrl: typeof window !== "undefined" ? window.location.href.split("#")[0] : "",
    rulesUrl: typeof window !== "undefined" ? `${window.location.origin}/rules` : "/rules",
  });

  const submit = async () => {
    const games = rows.filter((r) => r.homePlayerId && r.awayPlayerId && r.homeGoals !== "" && r.awayGoals !== "");
    if (!games.length) return setMsg("Fill in at least one game (both players and both scores).");
    setBusy(true);
    setMsg("");
    try {
      const j = await fetch(`/api/matches/${fixtureId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, games, proof, notes, by }),
      }).then((r) => r.json());
      if (!j.success) throw new Error(j.error?.message || "Could not submit");
      onSubmitted({ games, proof, notes, by, at: new Date().toISOString() });
      setMsg("✓ Result submitted. An admin will check and approve it.");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {priv.groupLink && (
          <a href={priv.groupLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-xs font-black">
            <MessageCircle className="w-4 h-4" /> Open match group
          </a>
        )}
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setMsg("✓ Match text copied — paste it in the group.");
            } catch {
              setMsg("Could not copy.");
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-black hover:bg-slate-200"
        >
          <Copy className="w-4 h-4" /> Copy match text
        </button>
      </div>

      {approved ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Result approved: {f.homeClub?.name} {f.result.homeScore} – {f.result.awayScore} {f.awayClub?.name}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black">Submit the result</h3>
            {priv.claim && <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-black">Submitted {fmt(priv.claim.at)} · waiting for approval</span>}
          </div>
          <div className="space-y-1.5">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_44px_10px_44px_1fr] items-center gap-1.5">
                {fixedPairs ? (
                  <span className="text-xs font-bold truncate">{name(r.homePlayerId)}</span>
                ) : (
                  <select value={r.homePlayerId} onChange={(e) => set(i, "homePlayerId", e.target.value)} className="px-2 py-2 rounded-lg border border-slate-200 text-xs">
                    <option value="">Home player…</option>
                    {data.squads.home.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                )}
                <input inputMode="numeric" value={r.homeGoals} onChange={(e) => set(i, "homeGoals", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="0" className="px-1 py-2 rounded-lg border border-slate-200 text-center font-mono font-black text-sm" />
                <span className="text-center text-slate-400 font-black">:</span>
                <input inputMode="numeric" value={r.awayGoals} onChange={(e) => set(i, "awayGoals", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="0" className="px-1 py-2 rounded-lg border border-slate-200 text-center font-mono font-black text-sm" />
                {fixedPairs ? (
                  <span className="text-xs font-bold truncate text-right">{name(r.awayPlayerId)}</span>
                ) : (
                  <select value={r.awayPlayerId} onChange={(e) => set(i, "awayPlayerId", e.target.value)} className="px-2 py-2 rounded-lg border border-slate-200 text-xs">
                    <option value="">Away player…</option>
                    {data.squads.away.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={by} onChange={(e) => setBy(e.target.value)} placeholder="Your name (captain)" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="Proof link (screenshot / Facebook post)" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes for the admin (optional)" className="sm:col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          </div>
          <button onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-black text-white text-xs font-black disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {priv.claim ? "Update submitted result" : "Submit result"}
          </button>
        </div>
      )}
      {msg && <p className={`text-xs font-bold ${msg.startsWith("✓") ? "text-emerald-700" : "text-rose-600"}`}>{msg}</p>}
    </div>
  );
}
