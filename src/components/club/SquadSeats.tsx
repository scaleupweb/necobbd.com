import Link from "next/link";
import { Armchair } from "lucide-react";
import { SQUAD_LIMIT } from "@/lib/squad";

/** "Main Team Squad 23/30" with a fill bar. */
export function SquadCapacity({ count, className = "" }: { count: number; className?: string }) {
  const full = count >= SQUAD_LIMIT;
  const pct = Math.min(100, Math.round((count / SQUAD_LIMIT) * 100));
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Armchair className="w-4 h-4 text-[#B0852A]" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-700">Main Team Squad</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-black text-slate-950">
            {count}/{SQUAD_LIMIT}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${full ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
            {full ? "Full" : `${SQUAD_LIMIT - count} open`}
          </span>
        </div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${full ? "bg-rose-500" : "bg-gradient-to-r from-emerald-400 to-[#C79A3B]"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** All 30 seats of the Main Team Squad: filled seats show the player, the rest are open. */
export function SquadSeats({ squad }: { squad: any[] }) {
  const players = [...squad].sort((a, b) => (a.shirtNo || 999) - (b.shirtNo || 999) || a.fullName.localeCompare(b.fullName)).slice(0, SQUAD_LIMIT);
  const seats = Array.from({ length: SQUAD_LIMIT }, (_, i) => players[i] || null);
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 space-y-5">
      <SquadCapacity count={squad.length} />
      <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-10 gap-x-2 gap-y-4">
        {seats.map((p, i) =>
          p ? (
            <Link key={p.id} href={`/players/${p.username}`} className="group flex flex-col items-center gap-1 min-w-0" title={p.fullName}>
              <span className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.avatar} alt="" loading="lazy" className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover bg-slate-100 ring-2 ring-[#C79A3B]/70 group-hover:ring-[#C79A3B]" />
                {p.shirtNo ? (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 rounded-full bg-slate-900 text-white text-[9px] font-black font-mono leading-4">{p.shirtNo}</span>
                ) : null}
              </span>
              <span className="w-full text-center text-[10px] font-bold text-slate-700 truncate group-hover:underline">{p.fullName.split(" ")[0]}</span>
            </Link>
          ) : (
            <div key={`open-${i}`} className="flex flex-col items-center gap-1">
              <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-[11px] font-black font-mono text-slate-300">
                {i + 1}
              </span>
              <span className="text-[10px] font-semibold text-slate-300">Open</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
