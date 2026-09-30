import Link from "next/link";
import { Shield, Users, GraduationCap, MapPin, ArrowUpRight } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { FitImage } from "@/components/ui/FitImage";
import type { HomepageData } from "@/lib/homepage";

type Club = HomepageData["clubsSpotlight"]["clubs"][number];

const MEDALS = [
  { label: "1st", ring: "from-[#F7DC8B] via-[#C79A3B] to-[#8a6420]", text: "text-[#F3D48A]", glow: "shadow-[0_20px_60px_-20px_rgba(199,154,59,0.6)]" },
  { label: "2nd", ring: "from-slate-100 via-slate-300 to-slate-500", text: "text-slate-200", glow: "shadow-[0_20px_60px_-25px_rgba(203,213,225,0.45)]" },
  { label: "3rd", ring: "from-[#F0B27A] via-[#B8733A] to-[#7A4520]", text: "text-[#F0B27A]", glow: "shadow-[0_20px_60px_-25px_rgba(184,115,58,0.5)]" },
];

/** Dark band showcasing the biggest clubs: a podium for the top three, then a ranked list. */
export function ClubsSpotlight({ title, data }: { title: string; data: HomepageData["clubsSpotlight"] }) {
  if (!data.clubs.length) return null;
  const top = data.clubs.slice(0, 3);
  const rest = data.clubs.slice(3);
  const max = Math.max(1, ...data.clubs.map((c) => c.squadCount || 0));

  return (
    <section className="w-full py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2rem] overflow-hidden bg-[#0B0C0F] text-white p-4 sm:p-8">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(199,154,59,0.22),transparent_50%),radial-gradient(ellipse_at_0%_100%,rgba(16,185,129,0.14),transparent_45%)]" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.05] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
            style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />

          <div className="relative">
            <SectionHeader icon={Shield} title={title} subtitle={`${data.totalClubs} clubs · ${data.clubPlayers} registered club players`} href="/clubs" dark />

            {/* Podium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {top.map((c, i) => (
                <PodiumCard key={c.slug} club={c} rank={i} max={max} />
              ))}
            </div>

            {/* Ranked list */}
            {rest.length > 0 && (
              <div className="mt-3 sm:mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {rest.map((c, i) => (
                  <Link
                    key={c.slug}
                    href={`/clubs/${c.slug}`}
                    className="group flex items-center gap-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#C79A3B]/50 hover:bg-white/[0.07] p-3 transition-all"
                  >
                    <span className="w-6 text-center text-sm font-black font-mono text-white/35 group-hover:text-[#C79A3B]">{i + 4}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.logo} alt="" className="w-11 h-11 rounded-xl object-cover bg-white shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-bold truncate">{c.name}</span>
                        {c.isAcademy && <GraduationCap className="w-3.5 h-3.5 text-emerald-300 shrink-0" aria-label="Academy" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/45 min-w-0">
                        <span className="font-black tracking-widest shrink-0">{c.shortName}</span>
                        {c.location && (
                          <span className="inline-flex items-center gap-0.5 truncate">
                            <MapPin className="w-2.5 h-2.5 shrink-0" /> <span className="truncate">{c.location}</span>
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#C79A3B]" style={{ width: `${Math.round(((c.squadCount || 0) / max) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-black font-mono leading-none">{c.squadCount}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-white/40 mt-0.5">players</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PodiumCard({ club: c, rank, max }: { club: Club; rank: number; max: number }) {
  const m = MEDALS[rank];
  return (
    <Link
      href={`/clubs/${c.slug}`}
      className={`group relative rounded-3xl overflow-hidden bg-[#15161A] border border-white/10 hover:border-white/25 hover:-translate-y-1 transition-all ${m.glow}`}
    >
      {/* Banner */}
      <div className="relative h-24 sm:h-28 overflow-hidden">
        {c.banner ? (
          <FitImage src={c.banner} className="opacity-80" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${m.ring} opacity-25`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#15161A] to-transparent" />
        <span aria-hidden className="absolute right-3 -bottom-4 text-7xl font-black leading-none text-white/[0.07] select-none">{c.shortName}</span>
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur text-[10px] font-black uppercase tracking-widest ${m.text}`}>
          {m.label}
        </span>
        <ArrowUpRight className="absolute top-3 right-3 w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
      </div>

      <div className="relative px-4 pb-4 -mt-10 flex items-end gap-3">
        <span className={`shrink-0 rounded-2xl bg-gradient-to-br ${m.ring} p-[3px]`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.logo} alt="" className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-[13px] object-cover bg-white group-hover:scale-[1.03] transition-transform" />
        </span>
        <div className="min-w-0 flex-1 pb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base font-black truncate">{c.name}</span>
            {c.isAcademy && <GraduationCap className="w-4 h-4 text-emerald-300 shrink-0" aria-label="Academy" />}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/50 min-w-0">
            <span className="font-black tracking-widest shrink-0">{c.shortName}</span>
            {c.location && (
              <span className="inline-flex items-center gap-0.5 truncate">
                <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{c.location}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="inline-flex items-center gap-1 text-white/60">
            <Users className="w-3.5 h-3.5 text-emerald-400" /> Squad
          </span>
          <span className="font-mono text-white">{c.squadCount} players</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${m.ring}`} style={{ width: `${Math.round(((c.squadCount || 0) / max) * 100)}%` }} />
        </div>
      </div>
    </Link>
  );
}
