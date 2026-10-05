import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowRightLeft, ArrowUpRight, Smartphone, Sparkles, Tag, Zap } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import type { HomepageData } from "@/lib/homepage";
import type { SiteSettings } from "@/lib/site-settings";

type Player = HomepageData["transferPlayers"][number];

const STATUS = {
  "Free Agent": { label: "Free Agent", icon: Zap, cls: "bg-gradient-to-r from-amber-300 to-amber-500 text-[#2b1a00]" },
  Unsigned: { label: "Available", icon: Sparkles, cls: "bg-emerald-500 text-white" },
  Listed: { label: "Listed", icon: Tag, cls: "bg-violet-600 text-white" },
} as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function PlayerCard({ p }: { p: Player }) {
  const st = STATUS[p.status];
  const Icon = st.icon;
  const photo = p.avatar && !p.avatar.startsWith("/images/placeholders");
  return (
    <Link
      href={`/players/${p.username}`}
      className="group relative w-[170px] sm:w-[190px] lg:w-auto shrink-0 snap-start flex flex-col rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#C79A3B]/60 transition-all duration-300"
    >
      {/* Photo */}
      <div className="relative h-40 sm:h-44 bg-gradient-to-b from-[#1d1e24] to-[#0B0C0F] overflow-hidden">
        {photo ? (
          <Image src={p.avatar} alt={p.name} fill sizes="220px" className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div aria-hidden className="absolute w-40 h-40 rounded-full bg-[#C79A3B]/20 blur-2xl" />
            <span className="relative text-5xl font-black tracking-tight bg-gradient-to-b from-[#FFF3C4] to-[#C79A3B] bg-clip-text text-transparent">{initials(p.name)}</span>
          </div>
        )}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
        <span className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide shadow ${st.cls}`}>
          <Icon className="w-3 h-3" /> {st.label}
        </span>
        {p.position && <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur text-white text-[10px] font-black">{p.position}</span>}
        <span className="absolute bottom-2 right-2.5 inline-flex items-center gap-0.5 text-[10px] font-black text-white/0 group-hover:text-white transition-colors">
          View <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col p-3 sm:p-3.5">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-sm font-black text-[#111111] truncate">{p.name}</span>
          {p.verified && <VerifiedBadge className="w-4 h-4" />}
        </div>
        <div className="mt-0.5 text-[11px] text-slate-500 truncate">{p.note}</div>
        {p.device && (
          <div className="mt-auto pt-2.5 flex items-center gap-1 text-[10px] font-semibold text-slate-500 min-w-0 border-t border-slate-100 mt-2.5">
            <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{p.device}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function TransferMarketSection({
  content,
  players,
  stats,
}: {
  content: SiteSettings["sections"]["transfers"];
  players: HomepageData["transferPlayers"];
  stats: HomepageData["transferStats"];
}) {
  return (
    <section className="w-full py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          icon={ArrowRightLeft}
          title={content.title}
          subtitle={`${stats.available} players available${stats.freeAgents ? ` · ${stats.freeAgents} free agents` : ""}`}
          href="/transfer-market"
          accent="bg-violet-600 text-white"
          badge={
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Open now
            </span>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] gap-4 items-stretch">
          {/* Players */}
          <div className="flex lg:grid lg:grid-cols-3 gap-3.5 sm:gap-4 overflow-x-auto lg:overflow-visible no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            {players.map((p) => (
              <PlayerCard key={p.id} p={p} />
            ))}
            {players.length === 0 && (
              <div className="lg:col-span-3 w-full rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                Every player is signed right now. Check back soon.
              </div>
            )}
          </div>

          {/* Promo */}
          <div className="relative overflow-hidden rounded-3xl bg-[#0B0C0F] text-white p-6 flex flex-col min-h-[300px]">
            <div aria-hidden className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#C79A3B]/30 blur-[90px]" />
            <div aria-hidden className="absolute -bottom-24 -right-10 w-64 h-64 rounded-full bg-violet-600/25 blur-[90px]" />
            {content.promoImage && (
              <div className="absolute inset-y-0 right-0 w-[60%] pointer-events-none">
                <Image src={content.promoImage} alt="" fill sizes="340px" className="object-cover object-top opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C0F] via-[#0B0C0F]/70 to-transparent" />
              </div>
            )}
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C79A3B]/15 border border-[#C79A3B]/40 text-[#F7DC8B] text-[10px] font-black uppercase tracking-widest">
                <ArrowRightLeft className="w-3 h-3" /> Transfer window
              </span>
              <h3 className="mt-3 text-2xl sm:text-[28px] font-black leading-[1.1] tracking-tight">
                <span className="bg-gradient-to-r from-white to-[#F7DC8B] bg-clip-text text-transparent">{content.promoTitle}</span>
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed max-w-[90%]">{content.promoText}</p>
            </div>

            <div className="relative z-10 mt-5 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3 backdrop-blur">
                <div className="text-2xl font-black font-mono">{stats.available}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Available</div>
              </div>
              <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3 backdrop-blur">
                <div className="text-2xl font-black font-mono text-[#F7DC8B]">{stats.freeAgents}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Free agents</div>
              </div>
            </div>

            <div className="relative z-10 mt-auto pt-5">
              <Link href="/transfer-market" className="cd-cta group inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black text-[#0B0C0F]">
                {content.promoCta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
