"use client";

// Shared competition views (group tables, fixtures, knockout bracket) for the admin and public pages.

import Link from "next/link";
import { ReactNode } from "react";
import { Trophy, Crown, CalendarDays, ChevronRight, Swords } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ordinal } from "@/lib/competition";

type ClubMini = { id: string; name: string; shortName?: string; slug?: string; logo?: string } | null;

export function ClubLogo({ club, size = 28 }: { club: ClubMini; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={club?.logo || "/images/placeholders/club.svg"}
      alt=""
      width={size}
      height={size}
      className="rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

/** Black tile with a gold letter, used as the group badge. */
export function GroupBadge({ name, size = 34 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl bg-[#0F1012] text-amber-400 font-black shadow-sm ring-1 ring-amber-500/30"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {name}
    </span>
  );
}

function FormDots({ form }: { form: string[] }) {
  const tone: Record<string, string> = { W: "bg-emerald-500", D: "bg-slate-400", L: "bg-rose-500" };
  return (
    <span className="inline-flex gap-0.5">
      {form.slice(-5).map((r, i) => (
        <span key={i} title={r} className={`w-4 h-4 rounded text-[9px] leading-4 text-center font-black text-white ${tone[r] || "bg-slate-300"}`}>
          {r}
        </span>
      ))}
    </span>
  );
}

export function GroupTables({
  tables,
  advancePerGroup,
  bestPlacedIds = [],
  bestPlaced,
  clubHref = true,
}: {
  tables: any[];
  advancePerGroup: number;
  bestPlacedIds?: string[];
  bestPlaced?: number;
  clubHref?: boolean;
}) {
  const extra = bestPlaced ?? bestPlacedIds.length;
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {tables.map((t) => (
        <div key={t.name} className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2.5">
              <GroupBadge name={t.name} />
              <div>
                <div className="text-sm font-black text-black">Group {t.name}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.played}/{t.total} matches played
                  {t.byes ? <span className="ml-1.5 normal-case text-violet-700">· {t.byes} BYE{t.byes === 1 ? "" : "s"} (auto win)</span> : null}
                </div>
              </div>
            </div>
            <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${t.total ? (t.played / t.total) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="pl-4 pr-1 py-2 text-left w-7">#</th>
                  <th className="px-2 py-2 text-left">Club</th>
                  <th className="px-1.5 py-2 text-center" title="Played">P</th>
                  <th className="px-1.5 py-2 text-center" title="Won">W</th>
                  <th className="px-1.5 py-2 text-center" title="Drawn">D</th>
                  <th className="px-1.5 py-2 text-center" title="Lost">L</th>
                  <th className="px-1.5 py-2 text-center hidden sm:table-cell" title="Game points won : lost">GP</th>
                  <th className="px-1.5 py-2 text-center" title="Goal difference">GD</th>
                  <th className="px-1.5 py-2 text-center hidden md:table-cell">Form</th>
                  <th className="pl-1.5 pr-4 py-2 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {t.rows.map((r: any, i: number) => {
                  const q = i < advancePerGroup;
                  const bp = !q && bestPlacedIds.includes(r.clubId);
                  const gd = r.goalsFor - r.goalsAgainst;
                  const name = (
                    <span className="flex items-center gap-2 min-w-0">
                      <ClubLogo club={r.club} size={24} />
                      <span className="font-bold text-black truncate max-w-[150px]">{r.club?.name || "Club"}</span>
                    </span>
                  );
                  return (
                    <tr key={r.clubId} className={`border-t border-slate-100 ${q ? "bg-emerald-50/40" : bp ? "bg-amber-50/60" : ""}`}>
                      <td className="pl-4 pr-1 py-2.5 relative">
                        {(q || bp) && <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r ${q ? "bg-emerald-500" : "bg-amber-500"}`} />}
                        <span className={`font-mono font-black ${q ? "text-emerald-700" : bp ? "text-amber-700" : "text-slate-400"}`}>{i + 1}</span>
                      </td>
                      <td className="px-2 py-2.5">
                        {clubHref && r.club?.slug ? (
                          <Link href={`/clubs/${r.club.slug}`} className="hover:underline">
                            {name}
                          </Link>
                        ) : (
                          name
                        )}
                      </td>
                      <td className="px-1.5 text-center font-mono">{r.played}</td>
                      <td className="px-1.5 text-center font-mono">{r.won}</td>
                      <td className="px-1.5 text-center font-mono">{r.drawn}</td>
                      <td className="px-1.5 text-center font-mono">{r.lost}</td>
                      <td className="px-1.5 text-center font-mono text-slate-500 hidden sm:table-cell">
                        {r.pointsFor}:{r.pointsAgainst}
                      </td>
                      <td className={`px-1.5 text-center font-mono ${gd > 0 ? "text-emerald-700" : gd < 0 ? "text-rose-600" : "text-slate-500"}`}>
                        {gd > 0 ? `+${gd}` : gd}
                      </td>
                      <td className="px-1.5 text-center hidden md:table-cell">
                        <FormDots form={r.form || []} />
                      </td>
                      <td className="pl-1.5 pr-4 text-center">
                        <span className="inline-block min-w-[28px] px-1.5 py-0.5 rounded-md bg-black text-white font-mono font-black">{r.points}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Top {advancePerGroup} go through
            {extra ? (
              <>
                <span className="w-2 h-2 rounded-sm bg-amber-500 ml-2" /> Best {extra} {ordinal(advancePerGroup + 1)}-placed (across all groups) also go through
              </>
            ) : (
              " to the knockout"
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** One club-vs-club match as a compact card. */
export function TieCard({ f, action, href }: { f: any; action?: ReactNode; href?: string }) {
  if (f.walkover)
    return (
      <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-3 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1">
            {f.group && <GroupBadge name={f.group} size={16} />}
            {f.matchNo ? `#${f.matchNo}` : ""}
          </span>
          <span className="text-violet-700">{formatDate(f.scheduledDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <ClubLogo club={f.homeClub} size={26} />
          <span className="flex-1 truncate text-xs font-black text-black">{f.homeClub?.name}</span>
          <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white text-[10px] font-black">W/O</span>
        </div>
        <div className="flex items-center gap-2 opacity-70">
          <span className="w-[26px] h-[26px] rounded-lg border-2 border-dashed border-violet-300 text-violet-600 text-[8px] font-black flex items-center justify-center">BYE</span>
          <span className="flex-1 text-xs font-bold text-violet-700">BYE (empty slot)</span>
        </div>
        <div className="text-[10px] font-bold text-violet-700 text-center pt-1 border-t border-violet-100">Automatic win · 3 points</div>
      </div>
    );
  const done = f.result?.status === "APPROVED";
  const hp = f.result?.homeScore;
  const ap = f.result?.awayScore;
  const hw = done && hp > ap;
  const aw = done && ap > hp;
  const row = (club: ClubMini, pts: any, goals: any, win: boolean) => (
    <div className={`flex items-center gap-2 ${done && !win ? "opacity-60" : ""}`}>
      <ClubLogo club={club} size={26} />
      <span className={`flex-1 truncate text-xs ${win ? "font-black text-black" : "font-bold text-slate-800"}`}>{club?.name || "TBD"}</span>
      {done && <span className="text-[10px] font-mono text-slate-400" title="Goals">{goals}g</span>}
      <span className={`w-8 text-center rounded-md py-0.5 font-mono text-sm font-black ${done ? (win ? "bg-black text-white" : "bg-slate-100 text-slate-600") : "text-slate-300"}`}>
        {done ? pts : "–"}
      </span>
    </div>
  );
  const body = (
    <>
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
        <span className="inline-flex items-center gap-1">
          {f.group && <GroupBadge name={f.group} size={16} />}
          {f.matchNo ? `#${f.matchNo}` : ""} {f.leg && f.stage === "KNOCKOUT" && f.round?.includes("Leg") ? `· Leg ${f.leg}` : ""}
        </span>
        <span className={done ? "text-emerald-700" : ""}>{done ? "Full time" : formatDate(f.scheduledDate)}</span>
      </div>
      {row(f.homeClub, hp, f.result?.homeGoals ?? 0, hw)}
      {row(f.awayClub, ap, f.result?.awayGoals ?? 0, aw)}
    </>
  );
  return (
    <div className={`rounded-2xl bg-white border p-3 space-y-2 shadow-sm transition-colors ${done ? "border-slate-200" : "border-slate-200 hover:border-amber-400"}`}>
      {href ? (
        <Link href={href} className="block space-y-2">
          {body}
        </Link>
      ) : (
        body
      )}
      {action}
    </div>
  );
}

/** Fixtures grouped by matchday (group stage) or round (knockout). */
export function FixtureRounds({ fixtures, renderAction, linkMatches }: { fixtures: any[]; renderAction?: (f: any) => ReactNode; linkMatches?: boolean }) {
  const blocks = new Map<string, { title: string; date?: string; list: any[] }>();
  for (const f of fixtures) {
    const key = f.stage === "GROUP" ? `G${f.roundNo}` : `K${f.roundNo}-${f.leg || 1}`;
    const title = f.stage === "GROUP" ? `Matchday ${(f.roundNo ?? 0) + 1}` : f.round;
    if (!blocks.has(key)) blocks.set(key, { title, date: f.scheduledDate, list: [] });
    blocks.get(key)!.list.push(f);
  }
  if (!blocks.size) return null;
  return (
    <div className="space-y-6">
      {[...blocks.entries()].map(([key, b]) => {
        const played = b.list.filter((f) => f.result?.status === "APPROVED" || f.walkover).length;
        return (
          <section key={key} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1012] text-white text-[11px] font-black uppercase tracking-wider">
                {key.startsWith("K") ? <Swords className="w-3.5 h-3.5 text-amber-400" /> : <CalendarDays className="w-3.5 h-3.5 text-amber-400" />}
                {b.title}
              </span>
              {b.date && <span className="text-[11px] font-bold text-slate-500">{formatDate(b.date)}</span>}
              <span className="flex-1 h-px bg-gradient-to-r from-amber-400/60 to-transparent" />
              <span className="text-[10px] font-bold text-slate-500">
                {played}/{b.list.length} played
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {b.list.map((f) => (
                <TieCard key={f.id} f={f} action={renderAction?.(f)} href={linkMatches ? `/matches/${f.id}` : undefined} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Knockout bracket: one column per round, ties show aggregate game points. */
export function Bracket({ knockout, champion, renderTieAction }: { knockout: any[]; champion?: ClubMini; renderTieAction?: (tie: any) => ReactNode }) {
  if (!knockout.length) return null;
  return (
    <div className="overflow-x-auto pb-3 -mx-1 px-1">
      <div className="flex items-stretch gap-6 min-w-max">
        {knockout.map((r, ri) => (
          <div key={r.roundNo} className="w-64 shrink-0 flex flex-col">
            <div className="text-center pb-3">
              <div className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${r.name === "Final" ? "bg-amber-500 text-black" : "bg-[#0F1012] text-white"}`}>
                {r.name}
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-around gap-3">
              {r.ties.map((t: any) => (
                <div key={t.key} className="relative">
                  <div className={`rounded-2xl bg-white border shadow-sm overflow-hidden ${t.winnerId ? "border-slate-200" : "border-amber-300"}`}>
                    {[
                      [t.clubA, t.aPoints, t.aGoals],
                      [t.clubB, t.bPoints, t.bGoals],
                    ].map(([c, pts, g]: any, i) => {
                      const win = t.winnerId && c?.id === t.winnerId;
                      return (
                        <div key={i} className={`flex items-center gap-2 px-3 py-2 ${i ? "border-t border-slate-100" : ""} ${win ? "bg-amber-50" : t.winnerId ? "opacity-55" : ""}`}>
                          <ClubLogo club={c} size={22} />
                          <span className={`flex-1 truncate text-xs ${win ? "font-black" : "font-bold"} text-black`}>{c?.name || "TBD"}</span>
                          {t.done || pts || g ? (
                            <>
                              <span className="text-[10px] font-mono text-slate-400">{g}g</span>
                              <span className={`w-7 text-center rounded font-mono text-xs font-black ${win ? "bg-black text-white" : "text-slate-600"}`}>{pts}</span>
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                    {t.needsDecider && <div className="px-3 py-1 text-[10px] font-bold text-amber-800 bg-amber-100">Level — pick the winner (decider)</div>}
                  </div>
                  {renderTieAction?.(t)}
                  {ri < knockout.length - 1 && <ChevronRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />}
                </div>
              ))}
            </div>
          </div>
        ))}
        {champion && (
          <div className="w-56 shrink-0 flex flex-col justify-center">
            <div className="rounded-3xl p-5 text-center bg-gradient-to-b from-[#0F1012] to-zinc-800 text-white shadow-xl ring-2 ring-amber-400/70">
              <Crown className="w-8 h-8 mx-auto text-amber-400" />
              <div className="mt-2 flex justify-center">
                <ClubLogo club={champion} size={56} />
              </div>
              <div className="mt-2 text-sm font-black">{champion.name}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mt-1 flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3" /> Champions
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Individual 1v1 games of a club match (public match page and admin view). */
export function GamesList({ games, motmId }: { games: any[]; motmId?: string }) {
  if (!games?.length) return null;
  return (
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
      {games.map((g, i) => {
        const hw = g.homeGoals > g.awayGoals;
        const aw = g.awayGoals > g.homeGoals;
        const p = (pl: any, win: boolean, right?: boolean) => (
          <div className={`flex-1 min-w-0 flex items-center gap-2 ${right ? "flex-row-reverse text-right" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pl?.avatar || "/images/placeholders/avatar.svg"} alt="" className="w-7 h-7 rounded-full object-cover bg-slate-100 shrink-0" />
            <div className="min-w-0">
              {pl?.username ? (
                <Link href={`/players/${pl.username}`} className={`block truncate text-xs hover:underline ${win ? "font-black text-black" : "font-bold text-slate-700"}`}>
                  {pl.fullName}
                </Link>
              ) : (
                <span className="text-xs text-slate-400">Unknown</span>
              )}
              {motmId && pl?.id === motmId && <span className="text-[9px] font-black text-amber-600">★ MOTM</span>}
            </div>
          </div>
        );
        return (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <span className="w-5 text-[10px] font-mono text-slate-400">{i + 1}</span>
            {p(g.homePlayer, hw)}
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-black">
              {g.homeGoals} - {g.awayGoals}
            </span>
            {p(g.awayPlayer, aw, true)}
          </div>
        );
      })}
    </div>
  );
}
