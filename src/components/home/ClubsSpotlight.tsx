import Link from "next/link";
import { Shield, Users, GraduationCap, MapPin } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import type { HomepageData } from "@/lib/homepage";

/** Dark band showcasing the biggest clubs (shown until clubs have league points). */
export function ClubsSpotlight({ title, data }: { title: string; data: HomepageData["clubsSpotlight"] }) {
  if (!data.clubs.length) return null;
  return (
    <section className="w-full py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2rem] overflow-hidden bg-[#0B0C0F] text-white p-5 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(199,154,59,0.25),transparent_50%),radial-gradient(ellipse_at_0%_100%,rgba(16,185,129,0.18),transparent_45%)]" />
          <div className="relative">
            <SectionHeader icon={Shield} title={title} subtitle={`${data.totalClubs} clubs · ${data.clubPlayers} registered club players`} href="/clubs" dark />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.clubs.map((c, i) => (
                <Link
                  key={c.slug}
                  href={`/clubs/${c.slug}`}
                  className="group relative rounded-2xl bg-white/[0.05] border border-white/10 hover:border-[#C79A3B]/60 hover:bg-white/[0.08] p-4 transition-all"
                >
                  {i < 3 && <span className="absolute top-2 right-2 text-[9px] font-black text-[#FBBF24]">#{i + 1}</span>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.logo} alt="" className="w-14 h-14 rounded-2xl object-cover bg-white mx-auto group-hover:scale-105 transition-transform" />
                  <div className="mt-3 text-center">
                    <div className="text-xs font-black truncate">{c.name}</div>
                    <div className="text-[10px] text-white/40 font-bold tracking-widest">{c.shortName}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-bold text-white/70">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-400" /> {c.squadCount}
                    </span>
                    {c.isAcademy && (
                      <span className="inline-flex items-center gap-0.5 text-emerald-300">
                        <GraduationCap className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  {c.location && (
                    <div className="mt-1 text-[9px] text-white/35 text-center truncate flex items-center justify-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {c.location}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
