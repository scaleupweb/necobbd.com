"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Settings2,
  Shuffle,
  LayoutGrid,
  Swords,
  Trophy,
  Crown,
  Loader2,
  Check,
  ExternalLink,
  CalendarPlus,
  Sparkles,
  RotateCcw,
  ListOrdered,
  GitFork,
  Save,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { api, Button, Empty, Notice, inputCls } from "@/components/admin/ui";
import { toast, confirmDialog } from "@/lib/feedback";
import { autoBestPlaced, groupLetter, groupSizes, isPowerOfTwo, knockoutRoundName, knockoutSize, matchesPerClub, ordinal, sizesFor, suggestFormats, validateConfig } from "@/lib/competition";
import { Bracket, ClubLogo, FixtureRounds, GroupBadge, GroupTables } from "@/components/competition/views";
import { TieResultModal } from "@/components/competition/TieResultModal";
import { FixturesPanel } from "@/components/competition/FixtureTools";

const STEPS = [
  { key: "settings", label: "Format", icon: Settings2 },
  { key: "draw", label: "Group draw", icon: Shuffle },
  { key: "groups", label: "Group stage", icon: LayoutGrid },
  { key: "knockout", label: "Knockout", icon: Swords },
  { key: "champion", label: "Champion", icon: Crown },
];

export default function CompetitionAdminPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [tab, setTab] = useState<"tables" | "fixtures" | "bracket">("tables");
  const [tieOf, setTieOf] = useState<string | null>(null);

  const load = useCallback(() => api(`/api/admin/tournaments/${id}/competition`).then(setData).catch((e) => setErr(e.message)), [id]);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (label: string, fn: () => Promise<any>, success?: string) => {
    setBusy(label);
    try {
      const d = await fn();
      if (d) setData(d);
      if (success) toast.success(success);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };
  const post = (json: any) => api(`/api/admin/tournaments/${id}/competition`, { method: "POST", json });

  if (err) return <Notice kind="err">{err}</Notice>;
  if (!data)
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );

  const { tournament, competition: comp, clubs, tables, fixtures, knockout, nextAction, champion } = data;
  const stepIdx =
    comp.stage === "COMPLETED" ? 4 : comp.stage === "KNOCKOUT" ? 3 : comp.stage === "GROUPS" ? (nextAction === "START_KNOCKOUT" ? 3 : 2) : comp.groups?.length ? 1 : comp.enabled ? 1 : 0;
  const approvedCount = fixtures.filter((f: any) => f.result?.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0F1012] text-white p-5 sm:p-7">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_85%_20%,rgba(245,158,11,0.45),transparent_45%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link href="/admin/tournaments" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/60 hover:text-white">
              <ArrowLeft className="w-3.5 h-3.5" /> Tournaments
            </Link>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight">{tournament.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black">Competition</span>
              <span className="text-white/60">
                {clubs.length} approved clubs · {comp.playersPerTie} players per match
              </span>
            </div>
          </div>
          <Link href={`/tournaments/${tournament.slug}`} target="_blank" className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold">
            <ExternalLink className="w-3.5 h-3.5" /> Public page
          </Link>
        </div>

        {/* Stepper */}
        <ol className="relative mt-6 grid grid-cols-5 gap-1">
          {STEPS.map((s, i) => {
            const done = i < stepIdx || comp.stage === "COMPLETED";
            const cur = i === stepIdx && comp.stage !== "COMPLETED";
            return (
              <li key={s.key} className="flex flex-col items-center text-center gap-1.5">
                <div className="relative w-full flex items-center justify-center">
                  {i > 0 && <span className={`absolute right-1/2 left-[-50%] top-1/2 h-0.5 ${i <= stepIdx ? "bg-amber-500" : "bg-white/15"}`} />}
                  <span
                    className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      done ? "bg-amber-500 text-black" : cur ? "bg-white text-black ring-4 ring-amber-500/40" : "bg-white/10 text-white/40"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </span>
                </div>
                <span className={`text-[10px] sm:text-[11px] font-bold ${cur ? "text-white" : done ? "text-amber-400" : "text-white/40"}`}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {clubs.length < 2 && (
        <Notice kind="err">
          At least 2 approved clubs are needed. Approve club registrations from Admin → Tournaments → Players first.
        </Notice>
      )}

      {comp.stage === "SETUP" && (
        <>
          <SettingsPanel comp={comp} clubCount={clubs.length} busy={busy} onSave={(cfg) => run("save", () => api(`/api/admin/tournaments/${id}/competition`, { method: "PATCH", json: cfg }), "Format saved")} />
          {comp.enabled && (
            <DrawPanel
              comp={comp}
              clubs={clubs}
              busy={busy}
              onRandom={() => run("draw", () => post({ action: "DRAW" }), "Groups drawn")}
              onSaveManual={(groups) => run("draw", () => post({ action: "DRAW", groups }), "Groups saved")}
              onGenerate={async () => {
                if (!(await confirmDialog({ title: "Generate group fixtures?", text: "All group matches are created with dates, and the tournament is set to In progress. Settings and the draw are locked after this (until a reset).", confirmText: "Generate" }))) return;
                run("fixtures", () => post({ action: "FIXTURES" }), "Fixtures generated");
              }}
            />
          )}
        </>
      )}

      {comp.stage !== "SETUP" && (
        <>
          <NextStepBanner
            nextAction={nextAction}
            knockout={knockout}
            comp={comp}
            busy={busy === "advance"}
            champion={champion}
            onAdvance={async () => {
              const msg: Record<string, string> = {
                START_KNOCKOUT: "The knockout bracket is drawn from the final group tables. Group results can't be rolled back after this.",
                NEXT_ROUND: "The next round is drawn from this round's winners.",
                FINISH: "The final's winner is crowned champion and the tournament is marked completed.",
              };
              if (!(await confirmDialog({ title: nextAction === "FINISH" ? "Crown the champion?" : "Draw the next round?", text: msg[nextAction], confirmText: "Continue" }))) return;
              run("advance", () => post({ action: "ADVANCE" }), nextAction === "FINISH" ? "Champion crowned!" : "Next round drawn");
              if (nextAction !== "FINISH") setTab("bracket");
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            {[
              { k: "tables", label: "Tables", icon: ListOrdered },
              { k: "fixtures", label: `Fixtures (${approvedCount}/${fixtures.length})`, icon: CalendarPlus },
              { k: "bracket", label: "Bracket", icon: GitFork },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as any)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  tab === t.k ? "bg-black text-white shadow" : "bg-white border border-slate-200 text-slate-700 hover:border-black"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>

          {tab === "tables" && (tables.length ? <GroupTables tables={tables} advancePerGroup={comp.advancePerGroup} bestPlacedIds={data.bestPlacedIds} clubHref={false} /> : <Empty>No groups.</Empty>)}
          {tab === "fixtures" && (
            <FixturesPanel data={data} onOpenTie={(f) => setTieOf(f.id)} reload={load} />
          )}
          {tab === "bracket" &&
            (knockout.length ? (
              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 sm:p-6">
                <Bracket
                  knockout={knockout}
                  champion={champion}
                  renderTieAction={(t) => (
                    <div className="flex gap-1 mt-1">
                      {t.fixtureIds.map((fid: string, i: number) => (
                        <button key={fid} onClick={() => setTieOf(fid)} className="flex-1 py-1 rounded-lg bg-white border border-slate-200 hover:border-black text-[10px] font-bold text-slate-700">
                          {t.fixtureIds.length > 1 ? `Leg ${i + 1}` : "Result"}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
            ) : (
              <BracketPreview comp={comp} />
            ))}

          {/* Danger zone */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black text-rose-800">Reset competition</div>
              <div className="text-[11px] text-rose-700/80">
                Deletes every group and knockout fixture and goes back to the format step. Only possible while no result is approved
                {approvedCount ? ` (${approvedCount} approved now — roll them back first)` : ""}.
              </div>
            </div>
            <Button
              variant="danger"
              small
              disabled={!!approvedCount || !!busy}
              onClick={async () => {
                if (!(await confirmDialog({ title: "Reset the competition?", text: "All competition fixtures are deleted.", confirmText: "Reset", danger: true, typeToConfirm: "RESET" }))) return;
                run("reset", () => post({ action: "RESET" }), "Competition reset");
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>
        </>
      )}

      {tieOf && <TieResultModal fixtureId={tieOf} lockReason={fixtures.find((x: any) => x.id === tieOf)?.rollbackLock} onClose={() => setTieOf(null)} onDone={load} />}
    </div>
  );
}

/* ---------------- Format settings ---------------- */

function SettingsPanel({ comp, clubCount, busy, onSave }: { comp: any; clubCount: number; busy: string; onSave: (cfg: any) => void }) {
  const suggestions = useMemo(() => suggestFormats(clubCount), [clubCount]);
  // Before the first save, start from the best fit for this many clubs (groups of 4–6, top 2 advance).
  const best = (() => {
    if (comp.enabled) return null;
    const s = suggestions;
    return s.find((x) => x.advancePerGroup === 2 && !x.bestPlaced && x.minSize >= 4 && x.maxSize <= 6) || s.find((x) => x.advancePerGroup === 2 && x.minSize >= 3) || s[0] || null;
  })();
  const [cfg, setCfg] = useState(() => ({
    groupCount: best?.groupCount ?? comp.groupCount,
    advancePerGroup: best?.advancePerGroup ?? comp.advancePerGroup,
    bestPlaced: best ? best.bestPlaced : comp.bestPlaced || 0,
    groupSizes: (best ? [] : comp.groupSizes || []) as number[],
    groupLegs: comp.groupLegs,
    knockoutLegs: comp.knockoutLegs,
    finalLegs: comp.finalLegs,
    playersPerTie: comp.playersPerTie,
    daysBetweenRounds: comp.daysBetweenRounds,
    firstMatchday: comp.firstMatchday ? String(comp.firstMatchday).slice(0, 10) : "",
  }));
  const isPreset = (c: typeof cfg) =>
    !c.groupSizes.length && suggestions.some((s) => s.groupCount === c.groupCount && s.advancePerGroup === c.advancePerGroup && s.bestPlaced === (c.bestPlaced || 0));
  const [custom, setCustom] = useState(() => !isPreset(cfg));
  const set = (k: string, v: any) => setCfg((c) => ({ ...c, [k]: v }));

  const errors = clubCount >= 2 ? validateConfig({ ...comp, ...cfg }, clubCount) : [];
  const sizes = clubCount >= 2 && cfg.groupCount >= 1 ? sizesFor(cfg, clubCount) : [];
  const placed = sizes.reduce((a, b) => a + b, 0);
  const groupMatches = sizes.reduce((s, n) => s + ((n * (n - 1)) / 2) * cfg.groupLegs, 0);
  const koSize = knockoutSize(cfg);
  const rounds: string[] = [];
  for (let n = koSize; n >= 2 && Number.isInteger(Math.log2(n)); n /= 2) rounds.push(knockoutRoundName(n));
  const nextPlace = ordinal(cfg.advancePerGroup + 1);

  // Custom: changing the number of groups re-splits the clubs evenly; sizes can then be edited one by one.
  const setGroupCount = (n: number) => setCfg((c) => ({ ...c, groupCount: n, groupSizes: groupSizes(clubCount, n), bestPlaced: Math.min(c.bestPlaced, Math.max(0, n - 1)) }));
  const setAllSizes = (n: number) => setCfg((c) => ({ ...c, groupSizes: Array.from({ length: c.groupCount }, () => n) }));
  const setSize = (i: number, n: number) => setCfg((c) => ({ ...c, groupSizes: (c.groupSizes.length ? c.groupSizes : groupSizes(clubCount, c.groupCount)).map((x, j) => (j === i ? n : x)) }));

  return (
    <section className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Settings2 className="w-4 h-4" />
        <h2 className="text-sm font-black">1 · Competition format</h2>
      </div>
      <div className="p-5 space-y-5">
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Suggested for {clubCount} clubs
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {suggestions.map((s) => {
              const on = !custom && s.groupCount === cfg.groupCount && s.advancePerGroup === cfg.advancePerGroup && s.bestPlaced === (cfg.bestPlaced || 0) && !cfg.groupSizes.length;
              return (
                <button
                  key={`${s.groupCount}-${s.advancePerGroup}-${s.bestPlaced}`}
                  onClick={() => {
                    setCustom(false);
                    setCfg((c) => ({ ...c, groupCount: s.groupCount, advancePerGroup: s.advancePerGroup, bestPlaced: s.bestPlaced, groupSizes: [] }));
                  }}
                  className={`text-left p-3 rounded-2xl border transition-all ${on ? "border-black bg-black text-white shadow-lg" : "border-slate-200 hover:border-amber-400 bg-white"}`}
                >
                  <div className="text-sm font-black">{s.groupCount === 1 ? "1 league" : `${s.groupCount} groups`}</div>
                  <div className={`text-[11px] ${on ? "text-white/70" : "text-slate-500"}`}>
                    {s.minSize === s.maxSize ? s.minSize : `${s.minSize}–${s.maxSize}`} clubs each · top {s.advancePerGroup}
                    {s.bestPlaced ? ` + ${s.bestPlaced} best ${ordinal(s.advancePerGroup + 1)}` : ""}
                  </div>
                  <div className={`mt-1.5 text-[10px] font-black uppercase tracking-wider ${on ? "text-amber-400" : "text-amber-600"}`}>→ {knockoutRoundName(s.bracket)}</div>
                </button>
              );
            })}
            <button
              onClick={() => {
                setCustom(true);
                setCfg((c) => ({ ...c, groupSizes: c.groupSizes.length ? c.groupSizes : groupSizes(clubCount, c.groupCount) }));
              }}
              className={`text-left p-3 rounded-2xl border-2 border-dashed transition-all ${custom ? "border-amber-500 bg-amber-50 shadow-lg" : "border-slate-300 hover:border-amber-400 bg-white"}`}
            >
              <div className="text-sm font-black flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" /> Custom
              </div>
              <div className="text-[11px] text-slate-500">Choose groups, clubs per group and who goes through</div>
              <div className="mt-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600">Make your own →</div>
            </button>
          </div>
        </div>

        {custom && (
          <div className="rounded-2xl border border-amber-300 bg-gradient-to-b from-amber-50/80 to-white p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-amber-900">
              <SlidersHorizontal className="w-4 h-4" /> Custom format
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Num label="Number of groups" value={cfg.groupCount} onChange={setGroupCount} min={1} max={Math.max(1, Math.min(26, Math.floor(clubCount / 2)))} />
              <Num
                label="Clubs in every group"
                value={sizes.length ? Math.round(placed / sizes.length) : 2}
                onChange={(n) => setAllSizes(Math.max(2, n))}
                min={2}
                max={64}
                hint="Sets all groups to the same size"
              />
              <Num label="Go through from each group" value={cfg.advancePerGroup} onChange={(v) => set("advancePerGroup", v)} min={1} max={8} hint={`Top ${cfg.advancePerGroup} of every group`} />
              <Num
                label={`Best ${nextPlace}-placed also go through`}
                value={cfg.bestPlaced || 0}
                onChange={(v) => set("bestPlaced", v)}
                min={0}
                max={Math.max(0, cfg.groupCount - 1)}
                hint="Fills the knockout up to 8, 16, 32…"
              />
            </div>

            {/* Per-group sizes */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Clubs per group</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${placed === clubCount ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
                    {placed === clubCount ? "✓ " : ""}
                    {placed} / {clubCount} clubs
                    {placed < clubCount ? ` · ${clubCount - placed} left` : placed > clubCount ? ` · ${placed - clubCount} too many` : ""}
                  </span>
                  <button type="button" onClick={() => setCfg((c) => ({ ...c, groupSizes: groupSizes(clubCount, c.groupCount) }))} className="text-[11px] font-bold text-slate-600 hover:text-black underline">
                    Split evenly
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-2">
                {sizes.map((n, i) => (
                  <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white border border-slate-200">
                    <GroupBadge name={groupLetter(i)} size={24} />
                    <button type="button" onClick={() => setSize(i, Math.max(2, n - 1))} className="w-6 h-6 rounded-lg hover:bg-slate-100 font-black text-slate-500">
                      −
                    </button>
                    <span className="flex-1 text-center font-mono font-black text-sm">{n}</span>
                    <button type="button" onClick={() => setSize(i, Math.min(64, n + 1))} className="w-6 h-6 rounded-lg hover:bg-slate-100 font-black text-slate-500">
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Knockout check */}
            <div className={`flex flex-wrap items-center gap-2 p-3 rounded-xl text-xs font-bold ${isPowerOfTwo(koSize) ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
              <span className="font-mono">
                {cfg.groupCount} × {cfg.advancePerGroup}
                {cfg.bestPlaced ? ` + ${cfg.bestPlaced}` : ""} = {koSize} clubs
              </span>
              <span>→ {isPowerOfTwo(koSize) ? knockoutRoundName(koSize) : "needs 2, 4, 8, 16, 32 or 64"}</span>
              {!isPowerOfTwo(koSize) && autoBestPlaced(cfg.groupCount, cfg.advancePerGroup) > 0 && (
                <button
                  type="button"
                  onClick={() => set("bestPlaced", autoBestPlaced(cfg.groupCount, cfg.advancePerGroup))}
                  className="ml-auto px-2.5 py-1 rounded-lg bg-black text-white text-[11px]"
                >
                  Fix: add {autoBestPlaced(cfg.groupCount, cfg.advancePerGroup)} best {nextPlace}-placed
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Num label="Players per match" value={cfg.playersPerTie} onChange={(v) => set("playersPerTie", v)} min={1} max={30} hint="1v1 games in one club match" />
          <Num label="Days between rounds" value={cfg.daysBetweenRounds} onChange={(v) => set("daysBetweenRounds", v)} min={1} max={30} />
          <Legs label="Group stage" value={cfg.groupLegs} onChange={(v) => set("groupLegs", v)} one="Play once" two="Home & away" />
          <label className="block space-y-1">
            <span className="block text-xs font-bold text-slate-700">First matchday</span>
            <input type="date" value={cfg.firstMatchday} onChange={(e) => set("firstMatchday", e.target.value)} className={inputCls} />
          </label>
          <Legs label="Knockout rounds" value={cfg.knockoutLegs} onChange={(v) => set("knockoutLegs", v)} one="One match" two="Two legs" />
          <Legs label="Final" value={cfg.finalLegs} onChange={(v) => set("finalLegs", v)} one="One match" two="Two legs" />
        </div>

        {/* Summary */}
        {sizes.length > 0 && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Groups" value={`${cfg.groupCount} × ${[...new Set(sizes)].sort((a, b) => b - a).join(" / ")} clubs`} />
            <Stat label="Matches per club" value={`${matchesPerClub(Math.min(...sizes), cfg.groupLegs)}${Math.min(...sizes) !== Math.max(...sizes) ? `–${matchesPerClub(Math.max(...sizes), cfg.groupLegs)}` : ""}`} />
            <Stat label="Group matches" value={String(groupMatches)} />
            <Stat
              label="Knockout"
              value={rounds.length ? `${cfg.bestPlaced ? `Top ${cfg.advancePerGroup} + ${cfg.bestPlaced} best ${nextPlace} · ` : ""}${rounds.join(" → ")}` : "—"}
            />
          </div>
        )}
        {errors.length > 0 && <Notice kind="err">{errors[0]}</Notice>}

        <div className="flex items-start gap-2 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Match = {cfg.playersPerTie} individual games. Game win 3 pts, draw 1. More game points wins the match: 3 table points (draw 1). Table order: points → game-point difference → goal difference → goals.
          {cfg.bestPlaced ? ` Best ${nextPlace}-placed clubs are compared by points per match, then game-point and goal difference.` : ""}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() =>
              onSave({
                ...cfg,
                groupSizes: custom ? sizes : [],
                firstMatchday: cfg.firstMatchday ? new Date(cfg.firstMatchday + "T18:00:00").toISOString() : "",
              })
            }
            disabled={!!busy || errors.length > 0 || clubCount < 2}
          >
            {busy === "save" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {comp.enabled ? "Update format" : "Save format"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Num({ label, value, onChange, min, max, hint }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-bold text-slate-700">{label}</span>
      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="px-3 py-2 text-slate-500 hover:bg-slate-100 font-black">
          −
        </button>
        <input value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value.replace(/\D/g, "")) || min)))} className="w-full bg-transparent text-center text-sm font-black font-mono focus:outline-none" />
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="px-3 py-2 text-slate-500 hover:bg-slate-100 font-black">
          +
        </button>
      </div>
      {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
    </label>
  );
}

function Legs({ label, value, onChange, one, two }: { label: string; value: number; onChange: (v: number) => void; one: string; two: string }) {
  return (
    <div className="space-y-1">
      <span className="block text-xs font-bold text-slate-700">{label}</span>
      <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 gap-1">
        {[
          [1, one],
          [2, two],
        ].map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v as number)} className={`py-1.5 rounded-lg text-[11px] font-bold ${value === v ? "bg-white shadow text-black" : "text-slate-500"}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-xs font-black text-black mt-0.5">{value}</div>
    </div>
  );
}

/* ---------------- Group draw ---------------- */

function DrawPanel({
  comp,
  clubs,
  busy,
  onRandom,
  onSaveManual,
  onGenerate,
}: {
  comp: any;
  clubs: any[];
  busy: string;
  onRandom: () => void;
  onSaveManual: (groups: { name: string; clubIds: string[] }[]) => void;
  onGenerate: () => void;
}) {
  const byId = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);
  const [groups, setGroups] = useState<{ name: string; clubIds: string[] }[]>(comp.groups || []);
  const [picked, setPicked] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  useEffect(() => setGroups(comp.groups || []), [comp.groups]);
  const edited = JSON.stringify(groups) !== JSON.stringify(comp.groups || []);
  const drawn = (comp.groups || []).length > 0;
  const placed = new Set(groups.flatMap((g) => g.clubIds));
  const unplaced = clubs.filter((c) => !placed.has(c.id));

  const startManual = () => setGroups(Array.from({ length: comp.groupCount }, (_, i) => ({ name: groupLetter(i), clubIds: [] })));
  const moveTo = (clubId: string, gi: number) =>
    setGroups((gs) => gs.map((g, i) => ({ ...g, clubIds: i === gi ? [...g.clubIds.filter((x) => x !== clubId), clubId] : g.clubIds.filter((x) => x !== clubId) })));
  const removeFrom = (clubId: string) => setGroups((gs) => gs.map((g) => ({ ...g, clubIds: g.clubIds.filter((x) => x !== clubId) })));

  const chip = (clubId: string) => {
    const c = byId.get(clubId);
    return (
      <div
        key={clubId}
        draggable
        onDragStart={() => setDragging(clubId)}
        onDragEnd={() => setDragging(null)}
        onClick={() => setPicked(picked === clubId ? null : clubId)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl border cursor-grab active:cursor-grabbing select-none transition-all ${
          picked === clubId ? "border-amber-500 bg-amber-50 ring-2 ring-amber-300" : "border-slate-200 bg-white hover:border-slate-400"
        }`}
      >
        <ClubLogo club={c} size={22} />
        <span className="text-[11px] font-bold truncate flex-1">{c?.name}</span>
      </div>
    );
  };

  return (
    <section className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shuffle className="w-4 h-4" />
          <h2 className="text-sm font-black">2 · Group draw</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" small onClick={onRandom} disabled={!!busy}>
            {busy === "draw" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />} {drawn ? "Re-draw randomly" : "Random draw"}
          </Button>
          {!groups.length && (
            <Button variant="ghost" small onClick={startManual}>
              Arrange by hand
            </Button>
          )}
          {edited && groups.length > 0 && (
            <Button small onClick={() => onSaveManual(groups)} disabled={!!busy || unplaced.length > 0}>
              <Save className="w-3.5 h-3.5" /> Save draw
            </Button>
          )}
        </div>
      </div>
      <div className="p-5 space-y-4">
        {!groups.length ? (
          <Empty>Draw the {clubs.length} approved clubs into {comp.groupCount} groups randomly, or arrange them by hand.</Empty>
        ) : (
          <>
            <p className="text-[11px] text-slate-500">Drag a club to another group — or tap a club, then tap a group — to swap them around. Save when done.</p>
            {unplaced.length > 0 && (
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-3 space-y-2" onDragOver={(e) => e.preventDefault()} onDrop={() => dragging && removeFrom(dragging)}>
                <div className="text-[11px] font-black text-amber-800">Not placed yet ({unplaced.length})</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">{unplaced.map((c) => chip(c.id))}</div>
              </div>
            )}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
              {groups.map((g, gi) => (
                <div
                  key={g.name}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragging) moveTo(dragging, gi);
                    setDragging(null);
                  }}
                  onClick={() => {
                    if (picked && !g.clubIds.includes(picked)) {
                      moveTo(picked, gi);
                      setPicked(null);
                    }
                  }}
                  className={`rounded-2xl border p-3 space-y-2 min-h-[120px] transition-colors ${
                    (picked && !g.clubIds.includes(picked)) || dragging ? "border-amber-400 bg-amber-50/30 cursor-pointer" : "border-slate-200 bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GroupBadge name={g.name} size={26} />
                      <span className="text-xs font-black">Group {g.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{g.clubIds.length} clubs</span>
                  </div>
                  <div className="space-y-1.5">{g.clubIds.map(chip)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {drawn && !edited && (
          <div className="rounded-2xl bg-gradient-to-r from-[#0F1012] to-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
            <div>
              <div className="text-sm font-black">3 · Ready for the group stage</div>
              <div className="text-[11px] text-white/60">Every club plays everyone in its group. Dates start from the first matchday.</div>
            </div>
            <button onClick={onGenerate} disabled={!!busy} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black disabled:opacity-50">
              {busy === "fixtures" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarPlus className="w-3.5 h-3.5" />} Generate fixtures
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Progress ---------------- */

function NextStepBanner({ nextAction, knockout, comp, busy, champion, onAdvance }: { nextAction: string; knockout: any[]; comp: any; busy: boolean; champion: any; onAdvance: () => void }) {
  if (nextAction === "DONE")
    return (
      <div className="rounded-3xl p-5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black flex items-center gap-4 shadow-lg">
        <Crown className="w-10 h-10" />
        <div className="flex items-center gap-3">
          <ClubLogo club={champion} size={44} />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em]">Champions</div>
            <div className="text-lg font-black">{champion?.name}</div>
          </div>
        </div>
      </div>
    );
  const last = knockout[knockout.length - 1];
  const nextName =
    nextAction === "START_KNOCKOUT"
      ? knockoutRoundName(knockoutSize(comp))
      : nextAction === "NEXT_ROUND" && last
        ? knockoutRoundName(last.ties.length)
        : "";
  const info: Record<string, [string, string, string?]> = {
    PLAY_GROUPS: ["Group stage in progress", "Enter each match result from the Fixtures tab. The knockout unlocks when every group match is approved."],
    START_KNOCKOUT: ["Group stage complete!", `Draw the ${nextName} from the final tables.`, `Draw ${nextName}`],
    PLAY_KNOCKOUT: [`${last?.name || "Knockout"} in progress`, "Enter the results from the Bracket tab. A level tie needs a decider on its last leg."],
    NEXT_ROUND: [`${last?.name} complete!`, `Draw the ${nextName} from the winners.`, `Draw ${nextName}`],
    FINISH: ["The final is decided!", "Crown the champion to finish the tournament.", "Crown champion"],
  };
  const [title, text, cta] = info[nextAction] || ["", ""];
  return (
    <div className={`rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${cta ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200"}`}>
      <div className="flex items-center gap-3">
        <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${cta ? "bg-amber-500 text-black" : "bg-slate-100 text-slate-600"}`}>
          {nextAction === "FINISH" ? <Trophy className="w-5 h-5" /> : cta ? <Sparkles className="w-5 h-5" /> : <Swords className="w-5 h-5" />}
        </span>
        <div>
          <div className="text-sm font-black text-black">{title}</div>
          <div className="text-[11px] text-slate-600">{text}</div>
        </div>
      </div>
      {cta && (
        <button onClick={onAdvance} disabled={busy} className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-black disabled:opacity-50">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : nextAction === "FINISH" ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <GitFork className="w-3.5 h-3.5 text-amber-400" />} {cta}
        </button>
      )}
    </div>
  );
}

function BracketPreview({ comp }: { comp: any }) {
  const rounds: string[] = [];
  for (let n = knockoutSize(comp); n >= 2; n /= 2) rounds.push(knockoutRoundName(n));
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-3">
      <GitFork className="w-8 h-8 mx-auto text-slate-300" />
      <div className="text-sm font-black text-slate-700">The bracket is drawn when the group stage ends</div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {rounds.map((r, i) => (
          <span key={r} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            {i > 0 && <span className="text-slate-300">→</span>}
            <span className="px-2.5 py-1 rounded-full bg-slate-100">{r}</span>
          </span>
        ))}
      </div>
      <div className="text-[11px] text-slate-500">
        Top {comp.advancePerGroup} of each group advance
        {comp.bestPlaced ? ` + the ${comp.bestPlaced} best ${ordinal(comp.advancePerGroup + 1)}-placed clubs` : ""}
        {comp.advancePerGroup === 2 && !comp.bestPlaced ? " · group winners face runners-up of another group" : ""}.
      </div>
    </div>
  );
}
