"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Save, Loader2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { api, Button, Field, inputCls, Notice, PageHeader, Toggle } from "@/components/admin/ui";
import { ImageInput } from "@/components/ui/ImageInput";
import { MailTestButton } from "@/components/admin/MailTestButton";
import type { SiteSettings } from "@/lib/site-settings";

const TABS = [
  ["brand", "Brand"],
  ["hero", "Hero banner"],
  ["sections", "Homepage sections"],
  ["cta", "Call-to-action"],
  ["announcement", "Announcement bar"],
  ["footer", "Footer & socials"],
  ["pages", "About & Rules"],
] as const;

type TabKey = (typeof TABS)[number][0];

const SECTION_LABELS: Record<string, string> = {
  liveMatches: "Live / upcoming matches",
  tournaments: "Ongoing tournaments",
  activity: "What's happening (activity feed)",
  weeklyStars: "Weekly stars",
  topScorers: "Top scorers table",
  clubRankings: "Club rankings table",
  transfers: "Transfer market",
  news: "Latest news",
  events: "Upcoming events",
  partners: "Partners marquee",
};

export default function SiteContentPage() {
  const [s, setS] = useState<SiteSettings | null>(null);
  const [tab, setTab] = useState<TabKey>("brand");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<SiteSettings>("/api/admin/settings").then(setS).catch((e) => setMsg({ ok: false, text: e.message }));
  }, []);

  // Update a nested value by dotted path, e.g. "hero.headingLine1".
  const set = (path: string, value: any) =>
    setS((prev) => {
      if (!prev) return prev;
      const next: any = structuredClone(prev);
      const keys = path.split(".");
      let o = next;
      for (const k of keys.slice(0, -1)) o = o[k];
      o[keys[keys.length - 1]] = value;
      return next;
    });

  const save = async () => {
    if (!s) return;
    setSaving(true);
    setMsg(null);
    try {
      const saved = await api<SiteSettings>("/api/admin/settings", { method: "PUT", json: s });
      setS(saved);
      setMsg({ ok: true, text: "Saved! Changes are live on the website." });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (!s) return msg ? <Notice kind="err">{msg.text}</Notice> : <div className="py-20 text-center text-xs text-slate-500 animate-pulse">Loading…</div>;

  const text = (path: string, label: string, opts: { area?: boolean; hint?: string; full?: boolean; placeholder?: string } = {}) => {
    const value = path.split(".").reduce((o: any, k) => o?.[k], s) ?? "";
    return (
      <Field label={label} hint={opts.hint} full={opts.full || opts.area}>
        {opts.area ? (
          <textarea className={inputCls} rows={opts.full ? 8 : 3} value={value} onChange={(e) => set(path, e.target.value)} placeholder={opts.placeholder} />
        ) : (
          <input className={inputCls} value={value} onChange={(e) => set(path, e.target.value)} placeholder={opts.placeholder} />
        )}
      </Field>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Homepage & Site Content"
        subtitle="Edit every piece of text and imagery on the public site. Changes go live as soon as you save."
        actions={
          <>
            <Link href="/" target="_blank" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:border-black">
              <ExternalLink className="w-3.5 h-3.5" /> View site
            </Link>
            <MailTestButton />
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
            </Button>
          </>
        }
      />

      {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${tab === k ? "bg-black text-white" : "bg-white border border-slate-200 text-slate-700 hover:border-black"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
        {tab === "brand" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {text("brand.siteName", "Site name", { hint: "Used in the browser tab title and SEO" })}
            {text("brand.tagline", "Tagline")}
            {text("brand.logoLine1", "Logo text (line 1)", { placeholder: "NEXA" })}
            {text("brand.logoLine2", "Logo text (line 2)", { placeholder: "FOOTBALL" })}
            <div className="sm:col-span-2">
              <ImageInput label="Logo image (optional — replaces the letter badge)" value={s.brand.logoUrl} onChange={(v) => set("brand.logoUrl", v)} />
            </div>
            {text("brand.description", "SEO description", { area: true })}
          </div>
        )}

        {tab === "hero" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {text("hero.eyebrow", "Small label above heading")}
            {text("hero.supportingText", "Supporting text")}
            {text("hero.headingLine1", "Heading line 1")}
            {text("hero.headingLine2", "Heading line 2")}
            {text("hero.highlightWord", "Highlighted word (gold)")}
            <div />
            {text("hero.ctaPrimaryLabel", "Primary button label")}
            {text("hero.ctaPrimaryHref", "Primary button link", { placeholder: "/register" })}
            {text("hero.ctaSecondaryLabel", "Secondary button label")}
            {text("hero.ctaSecondaryHref", "Secondary button link", { placeholder: "/tournaments" })}
            <div className="sm:col-span-2">
              <ImageInput label="Hero background image" value={s.hero.image} onChange={(v) => set("hero.image", v)} aspect="wide" />
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 space-y-3">
              <Toggle checked={s.hero.showStats} onChange={(v) => set("hero.showStats", v)} label="Show live stats row under the hero" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {text("hero.statLabels.players", "Players label")}
                {text("hero.statLabels.clubs", "Clubs label")}
                {text("hero.statLabels.tournaments", "Tournaments label")}
                {text("hero.statLabels.matches", "Matches label")}
              </div>
              <p className="text-[11px] text-slate-500">The numbers are counted automatically from the database.</p>
            </div>
          </div>
        )}

        {tab === "sections" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Turn sections on or off and rename their headings. Sections with no data are hidden automatically.</p>
            {Object.keys(SECTION_LABELS).map((key) => {
              const sec: any = (s.sections as any)[key];
              return (
                <div key={key} className={`p-4 rounded-xl border ${sec.show ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="sm:w-56 flex items-center gap-2 text-xs font-bold text-slate-800">
                      {sec.show ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                      {SECTION_LABELS[key]}
                    </div>
                    <input className={`${inputCls} flex-1`} value={sec.title} onChange={(e) => set(`sections.${key}.title`, e.target.value)} placeholder="Heading" />
                    <Toggle checked={sec.show} onChange={(v) => set(`sections.${key}.show`, v)} label={sec.show ? "Visible" : "Hidden"} />
                  </div>
                  {key === "weeklyStars" && <div className="mt-3">{text("sections.weeklyStars.subtitle", "Subtitle")}</div>}
                  {key === "partners" && <div className="mt-3">{text("sections.partners.subtitle", "Subtitle")}</div>}
                  {key === "transfers" && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {text("sections.transfers.promoTitle", "Promo card title")}
                      {text("sections.transfers.promoCta", "Promo button label")}
                      {text("sections.transfers.promoText", "Promo text", { area: true })}
                      <div className="sm:col-span-2">
                        <ImageInput label="Promo image" value={s.sections.transfers.promoImage} onChange={(v) => set("sections.transfers.promoImage", v)} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "cta" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Toggle checked={s.cta.show} onChange={(v) => set("cta.show", v)} label="Show the dark call-to-action banner" />
            </div>
            {text("cta.badge", "Badge text")}
            {text("cta.titleLine1", "Title")}
            {text("cta.highlight", "Highlighted title (gold)")}
            <div />
            {text("cta.text", "Body text", { area: true })}
            {text("cta.primaryLabel", "Primary button label")}
            {text("cta.primaryHref", "Primary button link")}
            {text("cta.secondaryLabel", "Secondary button label")}
            {text("cta.secondaryHref", "Secondary button link")}
            <div className="sm:col-span-2">
              <ImageInput label="Background image" value={s.cta.image} onChange={(v) => set("cta.image", v)} aspect="wide" />
            </div>
          </div>
        )}

        {tab === "announcement" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Toggle checked={s.announcement.show} onChange={(v) => set("announcement.show", v)} label="Show announcement bar at the top of every page" />
            </div>
            {text("announcement.text", "Message", { full: true, placeholder: "e.g. Season 2 registrations are now open!" })}
            {text("announcement.linkLabel", "Link label")}
            {text("announcement.linkHref", "Link URL", { placeholder: "/tournaments" })}
          </div>
        )}

        {tab === "footer" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {text("footer.headline", "Footer headline")}
            {text("footer.text", "Footer text")}
            {text("footer.copyright", "Copyright line", { hint: "{year} is replaced with the current year" })}
            {text("footer.email", "Contact email")}
            {text("footer.phone", "Contact phone")}
            {text("footer.address", "Address")}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">Social links (leave empty to hide)</div>
            {text("footer.socials.facebook", "Facebook URL")}
            {text("footer.socials.youtube", "YouTube URL")}
            {text("footer.socials.instagram", "Instagram URL")}
            {text("footer.socials.x", "X / Twitter URL")}
            {text("footer.socials.discord", "Discord invite URL")}
          </div>
        )}

        {tab === "pages" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {text("pages.aboutTitle", "About page title")}
            <div />
            {text("pages.aboutIntro", "About page introduction", { area: true })}
            {text("pages.rulesContent", "Rulebook content", {
              area: true,
              full: true,
              hint: "Leave empty to show the built-in rulebook. Separate paragraphs with a blank line.",
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
        </Button>
      </div>
    </div>
  );
}
