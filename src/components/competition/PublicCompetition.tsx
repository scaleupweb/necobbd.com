"use client";

import { useState } from "react";
import { ListOrdered, CalendarDays, GitFork, Info } from "lucide-react";
import { Bracket, ClubLogo, FixtureRounds, GroupBadge, GroupTables } from "./views";
import { knockoutRoundName, knockoutSize, ordinal } from "@/lib/competition";

/** Public tournament view: group tables, fixtures and the knockout bracket. */
export function PublicCompetition({ data }: { data: any }) {
  const { competition: comp, tables, fixtures, knockout, champion } = data;
  const started = fixtures.length > 0;
  const [tab, setTab] = useState<"tables" | "fixtures" | "bracket">(knockout.length && comp.stage !== "GROUPS" ? "bracket" : "tables");
  const rounds: string[] = [];
  for (let n = knockoutSize(comp); n >= 2; n /= 2) rounds.push(knockoutRoundName(n));

  const tabs = [
    { k: "tables", label: comp.groupCount === 1 ? "Table" : "Groups", icon: ListOrdered },
    { k: "fixtures", label: "Fixtures", icon: CalendarDays, hidden: !started },
    { k: "bracket", label: "Knockout", icon: GitFork },
  ].filter((t) => !t.hidden);

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#0F1012] text-amber-400 inline-flex items-center justify-center">
              <GitFork className="w-4 h-4" />
            </span>
            Competition
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            {comp.groupCount === 1 ? "League" : `${comp.groupCount} groups`} · top {comp.advancePerGroup}{comp.bestPlaced ? ` + ${comp.bestPlaced} best ${ordinal(comp.advancePerGroup + 1)}` : ""} advance → {rounds.join(" → ")} · {comp.playersPerTie} players per match
          </p>
        </div>
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 self-start">
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as any)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${tab === t.k ? "bg-black text-white shadow" : "text-slate-600 hover:text-black"}`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "tables" &&
        (started ? (
          <GroupTables tables={tables} advancePerGroup={comp.advancePerGroup} bestPlacedIds={data.bestPlacedIds} bestPlaced={comp.bestPlaced} />
        ) : (
          // Groups drawn, fixtures not out yet: show who is in which group.
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
            {tables.map((g: any) => (
              <div key={g.name} className="rounded-2xl bg-white border border-slate-200 p-3 space-y-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <GroupBadge name={g.name} size={26} />
                  <span className="text-xs font-black">Group {g.name}</span>
                </div>
                {g.rows.map((r: any) => (
                  <div key={r.clubId} className="flex items-center gap-2">
                    <ClubLogo club={r.club} size={22} />
                    <span className="text-[11px] font-bold truncate">{r.club?.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

      {tab === "fixtures" && <FixtureRounds fixtures={fixtures} linkMatches />}

      {tab === "bracket" &&
        (knockout.length ? (
          <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 sm:p-6">
            <Bracket knockout={knockout} champion={champion} />
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-2">
            <div className="flex flex-wrap justify-center gap-1.5">
              {rounds.map((r, i) => (
                <span key={r} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  {i > 0 && <span className="text-slate-300">→</span>}
                  <span className="px-2.5 py-1 rounded-full bg-slate-100">{r}</span>
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500">The knockout bracket is drawn from the group tables when the group stage ends.</p>
          </div>
        ))}

      <p className="text-[10px] text-slate-500 flex items-start gap-1.5">
        <Info className="w-3 h-3 shrink-0 mt-px" /> Each club match is {comp.playersPerTie} individual games (win 3 pts, draw 1). The club with more game points wins the match and gets 3 table points (draw 1).
      </p>
    </section>
  );
}
