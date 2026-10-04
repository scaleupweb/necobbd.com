import Link from "next/link";
import { UserPlus, BadgeCheck, Sparkles, Shield } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { formatRelativeTime } from "@/lib/utils";
import type { HomepageData } from "@/lib/homepage";

type P = HomepageData["newestPlayers"][number];

const BANDS = [
  "from-emerald-400 via-teal-400 to-cyan-500",
  "from-[#F7DC8B] via-[#C79A3B] to-[#8a6420]",
  "from-indigo-400 via-violet-500 to-fuchsia-500",
  "from-sky-400 via-blue-500 to-indigo-500",
  "from-rose-400 via-pink-500 to-orange-400",
];

/**
 * Latest players to join, as a strip that keeps looping sideways and pauses while
 * the pointer is over it (or a card has keyboard focus).
 */
export function NewestPlayers({ players }: { players: HomepageData["newestPlayers"] }) {
  if (!players.length) return null;
  // Short lists are repeated so the loop never shows a gap.
  const base = players.length < 8 ? [...players, ...players, ...players] : players;
  const duration = Math.max(30, base.length * 4.5);

  return (
    <section className="w-full py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader icon={UserPlus} title="New in the community" subtitle="Latest players to join · hover to pause" href="/players" accent="bg-emerald-500 text-white" />
      </div>
      <div
        className="marquee relative overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        style={{ ["--marquee-duration" as any]: `${duration}s` }}
      >
        <div className="marquee-track gap-4 pr-4">
          {[...base, ...base].map((p, i) => (
            <Card key={`${p.username}-${i}`} p={p} band={BANDS[i % BANDS.length]} hidden={i >= base.length} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({ p, band, hidden }: { p: P; band: string; hidden: boolean }) {
  return (
    <Link
      href={`/players/${p.username}`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className="group relative shrink-0 w-[200px] rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 transition-all duration-300"
    >
      {/* Colour band with the club crest as a watermark */}
      <div className={`relative h-16 bg-gradient-to-br ${band}`}>
        {p.clubLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.clubLogo} alt="" aria-hidden className="absolute -right-3 -top-3 w-20 h-20 rounded-2xl object-cover opacity-25 rotate-12" />
        )}
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/35 backdrop-blur text-white text-[9px] font-black tracking-widest">
          <Sparkles className="w-2.5 h-2.5" /> NEW
        </span>
      </div>

      <div className="px-4 pb-4 -mt-9 text-center">
        <div className="relative inline-block">
          <span className={`block rounded-full p-[3px] bg-gradient-to-br ${band}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.avatar} alt="" loading="lazy" className="w-[68px] h-[68px] rounded-full object-cover bg-slate-100 ring-[3px] ring-white" />
          </span>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-black ring-2 ring-white">{p.position}</span>
        </div>

        <div className="mt-2.5 flex items-center justify-center gap-1 min-w-0">
          <span className="text-sm font-black text-slate-950 truncate group-hover:underline">{p.name}</span>
          {p.verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
        </div>

        <div className="mt-1.5 flex items-center justify-center gap-1.5 min-w-0">
          {p.clubLogo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.clubLogo} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
              <span className="text-[11px] font-bold text-slate-600 truncate">{p.clubName}</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
              <Shield className="w-3 h-3" /> No club
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
          <span className="font-black font-mono text-slate-700">★ {p.rating}</span>
          <span className="font-semibold text-slate-400">{p.joinedAt ? `joined ${formatRelativeTime(p.joinedAt)}` : ""}</span>
        </div>
      </div>
    </Link>
  );
}
