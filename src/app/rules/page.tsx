import type { Metadata } from "next";
import { Scale, Settings2, Swords, Clock, Users, Wifi, Video, IdCard, ShieldAlert, Star, Flag, Shield, Trophy, Info, AlertTriangle, Ban } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { RANKING_FORMULA_CONFIG } from "@/lib/constants";
import { SQUAD_LIMIT, CONTRACT_DAYS, FREEZE_DAYS } from "@/lib/squad";
import { sanitizeRichText, isRichTextEmpty } from "@/lib/rich-text";
import { RULEBOOK, QUICK_FACTS, RuleItem, RuleSection } from "@/lib/rulebook";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rules", description: "Official match rules, fair play and tournament regulations." };

const ICONS: Record<RuleSection["icon"], any> = {
  settings: Settings2,
  swords: Swords,
  clock: Clock,
  users: Users,
  wifi: Wifi,
  video: Video,
  id: IdCard,
  card: ShieldAlert,
  star: Star,
  flag: Flag,
  shield: Shield,
  trophy: Trophy,
};

const fill = (t: string) =>
  t
    .replace("{SQUAD}", String(SQUAD_LIMIT))
    .replace("{CONTRACT}", String(CONTRACT_DAYS))
    .replace("{FREEZE}", String(FREEZE_DAYS))
    .replace("{BASE}", String(RANKING_FORMULA_CONFIG.BASE_RATING));

function Item({ item, n }: { item: RuleItem; n: string }) {
  const text = typeof item === "string" ? item : item.text;
  const sub = typeof item === "string" ? [] : item.sub || [];
  return (
    <li className="flex gap-3">
      <span className="shrink-0 mt-0.5 min-w-[2.4rem] h-6 px-1.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] font-black flex items-center justify-center">{n}</span>
      <div className="space-y-1.5">
        <p>{fill(text)}</p>
        {sub.length > 0 && (
          <ul className="space-y-1 pl-1">
            {sub.map((s, i) => (
              <li key={i} className="flex gap-2 text-slate-600">
                <span className="text-amber-500 font-black">›</span>
                <span>{fill(s)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export default async function RulesPage() {
  const { pages, brand } = await getSiteSettings();
  // Rulebook from the admin rich-text editor; older plain-text rules are the fallback; else the built-in rulebook.
  const html = isRichTextEmpty(pages.rulesHtml || "") ? "" : sanitizeRichText(pages.rulesHtml);
  const custom = html ? "" : pages.rulesContent.trim();
  const site = brand.siteName.trim();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-[2rem] bg-[#0B0C0F] text-white p-6 sm:p-10">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(245,158,11,0.3),transparent_50%),radial-gradient(ellipse_at_0%_100%,rgba(99,102,241,0.2),transparent_45%)]" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
            <Scale className="w-4 h-4" /> Official rulebook
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            {site} Rules <span className="text-white/40">&amp; Fair Play</span>
          </h1>
          <p className="text-sm text-white/60 max-w-2xl">How official matches are played, timed, proven and judged. Captains and players are expected to know these rules before every matchday.</p>
        </div>
        {!html && !custom && (
          <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {QUICK_FACTS.map((q) => (
              <div key={q.label} className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">{q.label}</div>
                <div className="text-lg font-black text-amber-400">{q.value}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {html && (
        <div className="p-5 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="rich-content text-sm sm:text-[15px]" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}

      {custom && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-slate-700 text-sm leading-relaxed space-y-4">
          {custom.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>
      )}

      {!html && !custom && (
        <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6 items-start">
          {/* Contents */}
          <nav className="lg:sticky lg:top-24 rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Contents</div>
            <ol className="grid grid-cols-2 lg:grid-cols-1 gap-0.5">
              {RULEBOOK.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-black">
                    <span className="w-5 text-[10px] font-mono text-amber-600">{i + 1}.</span>
                    <span className="truncate">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Sections */}
          <div className="space-y-5 text-slate-700 text-[13px] sm:text-sm leading-relaxed">
            {RULEBOOK.map((s, si) => {
              const Icon = ICONS[s.icon];
              let n = 0;
              return (
                <section key={s.id} id={s.id} className="scroll-mt-24 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <span className="w-10 h-10 rounded-2xl bg-[#0F1012] text-amber-400 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Section {si + 1}</div>
                      <h2 className="text-base sm:text-lg font-black text-slate-950">{s.title}</h2>
                    </div>
                  </div>
                  <div className="p-5 sm:p-6 space-y-5">
                    {s.intro && <p className="text-slate-600">{s.intro}</p>}
                    {s.blocks.map((b, bi) => {
                      const tone =
                        b.tone === "warn" ? "bg-amber-50/70 border-amber-200" : b.tone === "danger" ? "bg-rose-50/70 border-rose-200" : b.tone === "info" ? "bg-sky-50/70 border-sky-200" : "";
                      const ToneIcon = b.tone === "warn" ? AlertTriangle : b.tone === "danger" ? Ban : Info;
                      return (
                        <div key={bi} className={tone ? `rounded-2xl border p-4 space-y-3 ${tone}` : "space-y-3"}>
                          {b.title && (
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                              {b.tone && <ToneIcon className="w-4 h-4" />} {b.title}
                            </h3>
                          )}
                          {b.table && (
                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                              <table className="w-full text-xs sm:text-[13px]">
                                <thead className="bg-[#0F1012] text-white">
                                  <tr>
                                    {b.table.head.map((h) => (
                                      <th key={h} className="px-3 py-2 text-left font-black text-[11px] uppercase tracking-wider">
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {b.table.rows.map((r, ri) => (
                                    <tr key={ri} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60">
                                      {r.map((c, ci) => (
                                        <td key={ci} className={`px-3 py-2.5 align-top ${ci === 0 ? "font-black text-slate-900 whitespace-nowrap" : ""}`}>
                                          {c}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {b.items && (
                            <ul className="space-y-2.5">
                              {b.items.map((it, ii) => (
                                <Item key={ii} item={it} n={`${si + 1}.${++n}`} />
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            <p className="text-center text-[11px] text-slate-400">
              The {site} admins may update these rules; the version on this page is the one in force. Match operations and admins decide anything the rules don&apos;t cover.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
