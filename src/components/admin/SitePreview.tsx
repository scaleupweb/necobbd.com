"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Monitor, Smartphone, Eye, EyeOff } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { CommunityCTA } from "@/components/home/CommunityCta";
import { PartnersSection } from "@/components/home/PartnersSection";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/components/admin/ui";
import type { SiteSettings } from "@/lib/site-settings";

/**
 * Renders a page-width layout scaled down to fit the panel. Clicks inside are ignored so
 * links in the preview don't navigate away from the editor.
 */
function ScaledFrame({ width, children, maxHeight }: { width: number; children: ReactNode; maxHeight?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return;
      const s = Math.min(1, outer.current.clientWidth / width);
      setScale(s);
      setH(inner.current.scrollHeight * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={outer} className="relative w-full overflow-hidden" style={{ height: maxHeight ? Math.min(h, maxHeight) : h }}>
      <div
        ref={inner}
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="absolute top-0 left-0 origin-top-left select-none bg-[#F6F7F9]"
        style={{ width, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

const SECTION_ORDER: [string, string][] = [
  ["liveMatches", "Live / upcoming matches"],
  ["tournaments", "Ongoing tournaments"],
  ["activity", "What's happening"],
  ["clubRankings", "Clubs"],
  ["weeklyStars", "Weekly stars"],
  ["topScorers", "Top scorers"],
  ["transfers", "Transfer market"],
  ["news", "Latest news"],
  ["events", "Upcoming events"],
];

/** Live preview of the site content being edited, before it is saved. */
export function SitePreview({ s, tab }: { s: SiteSettings; tab: string }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [stats, setStats] = useState<{ value: string; label: string }[] | null>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const width = device === "desktop" ? 1280 : 390;

  useEffect(() => {
    api<any>("/api/admin/overview")
      .then((o) => {
        const st = o?.stats || {};
        setStats([
          { value: String(st.registeredPlayers ?? "—"), label: "" },
          { value: String(st.activeClubs ?? "—"), label: "" },
          { value: String(st.totalTournaments ?? "—"), label: "" },
          { value: String(st.completedMatches ?? "—"), label: "" },
        ]);
      })
      .catch(() => setStats(null));
    Promise.all([api<any[]>("/api/admin/resources/sponsors").catch(() => []), api<any[]>("/api/admin/resources/partners").catch(() => [])]).then(([sp, pa]) =>
      setPartners([
        ...sp.filter((x) => x.showOnHome !== false).map((x) => ({ name: x.name, category: "Official Sponsor", logo: x.logo, website: "", sponsor: true })),
        ...pa.filter((x) => x.showOnHome !== false).map((x) => ({ name: x.name, category: x.category, logo: x.logo, website: "", sponsor: false })),
      ])
    );
  }, []);

  const heroStats = s.hero.showStats
    ? [s.hero.statLabels.players, s.hero.statLabels.clubs, s.hero.statLabels.tournaments, s.hero.statLabels.matches].map((label, i) => ({
        value: stats?.[i]?.value ?? "—",
        label,
      }))
    : [];

  const brandBar = (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {s.brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.brand.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
          ) : (
            <span className="w-9 h-9 rounded-lg bg-black flex items-center justify-center font-black text-white">{s.brand.logoLine1.charAt(0) || "N"}</span>
          )}
          <span className="font-black text-lg text-[#111111] tracking-tight">
            {s.brand.logoLine1}
            <span className="text-[#C79A3B] ml-0.5">.</span>
          </span>
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{s.brand.logoLine2}</span>
        </div>
        {device === "desktop" ? (
          <div className="flex items-center gap-6 text-sm text-slate-600">
            {["Home", "Players", "Clubs", "Matches", "Tournaments", "Rankings", "News"].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        ) : (
          <span className="w-9 h-9 rounded-lg border border-slate-200" />
        )}
      </div>
    </div>
  );

  const announcement =
    s.announcement.show && s.announcement.text ? (
      <div className="w-full bg-[#111111] text-white text-sm">
        <div className="px-6 py-2.5 flex flex-wrap items-center justify-center gap-x-3 text-center">
          <span className="font-medium">{s.announcement.text}</span>
          {s.announcement.linkLabel && s.announcement.linkHref && <span className="font-bold text-[#FBBF24]">{s.announcement.linkLabel} →</span>}
        </div>
      </div>
    ) : null;

  let body: ReactNode;
  let caption = "Homepage";
  switch (tab) {
    case "brand":
      caption = "Header & footer";
      body = (
        <>
          {brandBar}
          <div className="h-10" />
          <Footer brand={s.brand} footer={s.footer} />
        </>
      );
      break;
    case "hero":
      caption = "Top of the homepage";
      body = (
        <>
          {announcement}
          {brandBar}
          <Hero hero={s.hero} stats={heroStats} />
        </>
      );
      break;
    case "sections":
      caption = "Homepage sections";
      body = (
        <div className="py-4">
          <Hero hero={s.hero} stats={heroStats} />
          {s.sections.partners.show && partners.length > 0 && <PartnersSection title={s.sections.partners.title} subtitle={s.sections.partners.subtitle} partners={partners} />}
          <div className="max-w-[1400px] mx-auto px-8 space-y-3 pb-6">
            {SECTION_ORDER.map(([k, label]) => {
              const sec: any = (s.sections as any)[k];
              return (
                <div
                  key={k}
                  className={`rounded-3xl border p-6 flex items-center justify-between ${sec.show ? "bg-white border-slate-200" : "bg-slate-100 border-dashed border-slate-300 opacity-50"}`}
                >
                  <div>
                    <div className="text-xl font-black text-[#111111]">{sec.title || label}</div>
                    <div className="text-sm text-slate-500">{label}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-black ${sec.show ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{sec.show ? "Visible" : "Hidden"}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
      break;
    case "cta":
      caption = "Call-to-action banner";
      body = s.cta.show ? <CommunityCTA cta={s.cta} /> : <Hidden text="The call-to-action banner is turned off." />;
      break;
    case "announcement":
      caption = "Top of every page";
      body = announcement ? (
        <>
          {announcement}
          {brandBar}
          <div className="h-24" />
        </>
      ) : (
        <Hidden text="The announcement bar is turned off or has no message." />
      );
      break;
    case "footer":
      caption = "Footer";
      body = <Footer brand={s.brand} footer={s.footer} />;
      break;
    case "pages":
      caption = "About page";
      body = (
        <div className="max-w-3xl mx-auto px-6 py-12 text-center space-y-4">
          <div className="inline-flex px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold uppercase">About {s.brand.siteName}</div>
          <h1 className="text-5xl font-black text-slate-950">{s.pages.aboutTitle}</h1>
          <p className="text-slate-600 text-base leading-relaxed whitespace-pre-line">{s.pages.aboutIntro}</p>
        </div>
      );
      break;
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex w-2.5 h-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-black text-slate-950">Live preview</span>
          <span className="text-[11px] text-slate-400 truncate">· {caption}</span>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100">
          {(
            [
              ["desktop", Monitor],
              ["mobile", Smartphone],
            ] as const
          ).map(([d, Icon]) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`w-8 h-7 rounded-md flex items-center justify-center ${device === d ? "bg-white shadow-sm text-slate-950" : "text-slate-400"}`}
              aria-label={`${d} preview`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Browser chrome */}
      <div className="p-3 bg-slate-100">
        <div className={`mx-auto rounded-2xl overflow-hidden bg-white shadow-lg ring-1 ring-black/5 ${device === "mobile" ? "max-w-[260px]" : ""}`}>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 flex-1 min-w-0 truncate rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
              {s.brand.siteName.trim() || "Site"} — {s.brand.tagline}
            </span>
          </div>
          <ScaledFrame width={width} maxHeight={device === "mobile" ? 560 : 640}>
            {body}
          </ScaledFrame>
        </div>
      </div>
      <p className="px-4 py-2.5 text-[11px] text-slate-400 border-t border-slate-100">Shows your changes before you save. Numbers and lists come from the live site.</p>
    </div>
  );
}

function Hidden({ text }: { text: string }) {
  return (
    <div className="py-24 text-center">
      <EyeOff className="w-10 h-10 mx-auto text-slate-300" />
      <div className="mt-3 text-lg font-bold text-slate-500">{text}</div>
      <div className="mt-1 text-sm text-slate-400 inline-flex items-center gap-1">
        <Eye className="w-4 h-4" /> Turn it on to see it here
      </div>
    </div>
  );
}
