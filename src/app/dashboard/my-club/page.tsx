"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { FitImage } from "@/components/ui/FitImage";
import { useClubHub } from "@/components/club-hub/ClubHubContext";
import { GROUPS, TOOLS, canOpen } from "@/components/club-hub/tools";
import { ClubToolsMenu } from "@/components/club-hub/ClubToolsMenu";

export default function ClubControlCenter() {
  const { club } = useClubHub();
  const [q, setQ] = useState("");

  const tools = useMemo(() => {
    const s = q.trim().toLowerCase();
    return TOOLS.filter((t) => canOpen(t, club.access, club.permissions) && (!s || `${t.label} ${t.desc}`.toLowerCase().includes(s)));
  }, [q, club.access, club.permissions]);

  return (
    <div className="space-y-5">
      {club.status === "PENDING" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          <strong>Waiting for approval.</strong> An admin will review your club soon. Once approved you can enter tournaments and sign players.
        </div>
      )}

      {/* Club summary */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0B0C0F] text-white">
        <FitImage src={club.banner} className="opacity-30" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0B0C0F] via-[#0B0C0F]/85 to-[#0B0C0F]/40" />
        <ClubToolsMenu dark className="absolute top-3 right-3 z-10" />
        <div className="relative p-5 sm:p-7 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex items-center gap-4 min-w-0 flex-1 pr-10 lg:pr-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={club.logo} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-white ring-4 ring-white/10 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C79A3B]">Club Control Center</div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight truncate">{club.name}</h1>
              <div className="text-xs text-white/55 truncate">
                {club.shortName}
                {club.location ? ` · ${club.location}` : ""}
                {club.managerName ? ` · Manager: ${club.managerName}` : ""}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            {[
              ["Squad", club.squad?.length ?? 0],
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

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tools…"
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-black"
        />
      </div>

      {/* Tool groups */}
      {GROUPS.map((g) => {
        const items = tools.filter((t) => t.group === g.id);
        if (!items.length) return null;
        return (
          <section key={g.id} className="space-y-3">
            <h2 className={`text-xs font-black uppercase tracking-[0.18em] ${g.tone}`}>{g.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((t) => (
                <Link
                  key={t.slug}
                  href={`/dashboard/my-club/${t.slug}`}
                  className="group relative flex items-start gap-3.5 rounded-2xl bg-white border border-slate-200 p-4 hover:border-slate-900 hover:shadow-md transition-all"
                >
                  <span className={`w-11 h-11 rounded-xl ring-1 flex items-center justify-center shrink-0 ${g.tile}`}>
                    <t.icon className="w-5 h-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-950">{t.label}</span>
                      {!t.ready && <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] font-black uppercase text-slate-500">Soon</span>}
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">{t.desc}</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {!tools.length && <div className="py-10 text-center text-sm text-slate-500">No tools match “{q}”.</div>}
    </div>
  );
}
