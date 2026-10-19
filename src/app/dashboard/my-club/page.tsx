"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { FitImage } from "@/components/ui/FitImage";
import { useClubHub } from "@/components/club-hub/ClubHubContext";
import { GROUPS, TOOLS, canOpen } from "@/components/club-hub/tools";
import { ClubToolsMenu } from "@/components/club-hub/ClubToolsMenu";
import { SQUAD_LIMIT } from "@/lib/squad";

export default function ClubControlCenter() {
  const { club } = useClubHub();
  const [q, setQ] = useState("");

  const tools = useMemo(() => {
    const s = q.trim().toLowerCase();
    return TOOLS.filter((t) => canOpen(t, club.access, club.permissions) && (!s || `${t.label} ${t.desc}`.toLowerCase().includes(s)));
  }, [q, club.access, club.permissions]);

  // The most used tools, shown as big buttons (only those this person can open).
  const QUICK = ["transfer-window", "register-player", "update-player", "tournament-registration"];
  const quick = TOOLS.filter((t) => QUICK.includes(t.slug) && t.ready && canOpen(t, club.access, club.permissions));

  return (
    <div className="space-y-5">
      {club.status === "PENDING" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          <strong>Waiting for approval.</strong> An admin will review your club soon. Once approved you can enter tournaments and sign players.
        </div>
      )}

      {/* Club summary */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0B0C0F] text-white">
        <FitImage src={club.banner} className="opacity-95" />
        {/* Light scrim only behind the text so the cover stays clearly visible */}
        {/* Phones: text sits on top of the cover, so dim it evenly. Wider screens: text is on the left only. */}
        <div aria-hidden className="absolute inset-0 bg-[#0B0C0F]/70 md:hidden" />
        <div aria-hidden className="absolute inset-0 hidden md:block bg-gradient-to-r from-[#0B0C0F]/65 via-[#0B0C0F]/25 to-transparent" />
        <ClubToolsMenu dark className="absolute top-3 right-3 z-10" />
        <div className="relative p-5 sm:p-7 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex items-center gap-4 min-w-0 flex-1 pr-10 lg:pr-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={club.logo} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-white ring-4 ring-white/10 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C79A3B]">Club Control Center</div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight truncate [text-shadow:0_2px_10px_rgba(0,0,0,0.6)]">{club.name}</h1>
              <div className="text-xs text-white/80 truncate [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">
                {club.shortName}
                {club.location ? ` · ${club.location}` : ""}
                {club.managerName ? ` · Manager: ${club.managerName}` : ""}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            {[
              ["Squad", `${club.squad?.length ?? 0}/${SQUAD_LIMIT}`],
              ["Points", club.points ?? 0],
              ["Value", formatCurrency(club.marketValue)],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-2xl bg-white/[0.07] border border-white/10 px-3 sm:px-4 py-2.5 text-center min-w-[84px]">
                <div className="text-lg sm:text-xl font-black font-mono">{v}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/45">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick actions + search */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 items-stretch">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {quick.map((t) => {
            const g = GROUPS.find((x) => x.id === t.group)!;
            return (
              <Link
                key={t.slug}
                href={`/dashboard/my-club/${t.slug}`}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${g.head} p-4 text-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all`}
              >
                <t.icon className="w-6 h-6" />
                <div className="mt-6 text-sm font-black leading-tight">{t.label}</div>
                <ArrowUpRight className="absolute top-3 right-3 w-4 h-4 text-white/60 group-hover:text-white" />
                <t.icon aria-hidden className="absolute -right-3 -bottom-3 w-20 h-20 text-white/10" />
              </Link>
            );
          })}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a tool…"
            className="w-full h-full min-h-[48px] pl-11 pr-4 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Tool panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {GROUPS.map((g) => {
          const items = tools.filter((t) => t.group === g.id);
          if (!items.length) return null;
          return (
            <section key={g.id} className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
              <div className={`flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r ${g.head} text-white`}>
                <div>
                  <h2 className="text-base font-black tracking-tight">{g.label}</h2>
                  <p className="text-[11px] text-white/75">{g.blurb}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-black">{items.length} tools</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 bg-white -mr-px -mb-px">
                {items.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/dashboard/my-club/${t.slug}`}
                    title={t.desc}
                    className="group relative flex flex-col items-center text-center gap-2 bg-white px-3 py-5 border-r border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <span className={`w-12 h-12 rounded-2xl ring-1 flex items-center justify-center ${g.tile} group-hover:scale-110 transition-transform`}>
                      <t.icon className="w-5 h-5" />
                    </span>
                    <span className="text-[13px] font-black text-slate-900 leading-tight">{t.label}</span>
                    <span className="text-[11px] text-slate-500 leading-snug line-clamp-2">{t.desc}</span>
                    {!t.ready && <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] font-black uppercase text-slate-400">Coming</span>}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {!tools.length && <div className="py-10 text-center text-sm text-slate-500">No tools match “{q}”.</div>}
    </div>
  );
}
