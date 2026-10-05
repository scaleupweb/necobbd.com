import Link from "next/link";
import { ArrowRight, Handshake } from "lucide-react";
import type { HomepageData } from "@/lib/homepage";

type Partner = HomepageData["partners"][number];

// Badge colours for partners without a logo, cycled so neighbours differ.
const BADGES = [
  "from-[#F7DC8B] via-[#C79A3B] to-[#8a6420] text-[#0B0C0F]",
  "from-[#1f2937] via-[#111827] to-black text-[#F7DC8B]",
  "from-emerald-400 via-teal-500 to-cyan-600 text-white",
  "from-indigo-500 via-violet-500 to-fuchsia-500 text-white",
  "from-sky-400 via-blue-500 to-indigo-600 text-white",
  "from-rose-400 via-pink-500 to-orange-400 text-white",
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const hasLogo = (p: Partner) => !!p.logo && !p.logo.startsWith("/images/placeholders");

/** Partners strip shown right under the hero: a heading on the left and a looping row of partner cards. */
export function PartnersSection({ title, subtitle, partners }: { title: string; subtitle: string; partners: HomepageData["partners"] }) {
  if (!partners.length) return null;
  // Short lists are repeated so the loop never shows a gap.
  const base = partners.length < 8 ? [...partners, ...partners, ...partners].slice(0, Math.max(8, partners.length)) : partners;
  const duration = Math.max(28, base.length * 5);

  return (
    <section className="w-full pb-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
          {/* soft gold glow behind the heading */}
          <div aria-hidden className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#C79A3B]/15 blur-[90px]" />

          <div className="relative flex flex-col lg:flex-row lg:items-center">
            {/* Heading */}
            <div className="shrink-0 px-5 sm:px-7 pt-6 lg:py-7 lg:w-[290px] lg:border-r lg:border-slate-100">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.3em] text-[#C79A3B]">
                <Handshake className="w-3.5 h-3.5" /> TRUSTED BY
              </div>
              <h2 className="mt-1.5 text-xl sm:text-2xl font-black text-[#111111] tracking-tight">{title}</h2>
              {subtitle && <p className="mt-1 text-xs sm:text-sm text-[#5F6368] leading-relaxed">{subtitle}</p>}
              <Link href="/partners" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#111111] hover:text-[#C79A3B] transition-colors">
                All partners <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Looping cards */}
            <div
              className="marquee relative flex-1 min-w-0 overflow-hidden py-5 lg:py-7 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
              style={{ ["--marquee-duration" as any]: `${duration}s` }}
            >
              <div className="marquee-track gap-3 sm:gap-4 pr-3 sm:pr-4">
                {[...base, ...base].map((p, i) => (
                  <PartnerCard key={`${p.name}-${i}`} p={p} badge={BADGES[i % BADGES.length]} hidden={i >= base.length} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerCard({ p, badge, hidden }: { p: Partner; badge: string; hidden: boolean }) {
  const body = (
    <div className="group relative w-[210px] sm:w-[230px] h-[82px] shrink-0 flex items-center gap-3 px-3.5 rounded-2xl bg-[#F6F7F9] border border-slate-200/80 hover:bg-white hover:border-[#C79A3B]/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 select-none">
      {hasLogo(p) ? (
        <span className="w-12 h-12 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.logo} alt="" className="max-w-[80%] max-h-[80%] object-contain" loading="lazy" />
        </span>
      ) : (
        <span className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${badge} flex items-center justify-center text-sm font-black tracking-wide shadow-sm`}>
          {initials(p.name)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-black text-[#111111] truncate group-hover:text-[#8a6420] transition-colors">{p.name}</span>
        {p.category && (
          <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-[#5F6368] truncate max-w-full">
            {p.category}
          </span>
        )}
      </span>
    </div>
  );
  const a11y = { "aria-hidden": hidden || undefined, tabIndex: hidden ? -1 : undefined };
  return p.website ? (
    <a href={p.website} target="_blank" rel="noopener noreferrer" aria-label={p.name} {...a11y}>
      {body}
    </a>
  ) : (
    <div aria-label={p.name} {...a11y}>
      {body}
    </div>
  );
}
