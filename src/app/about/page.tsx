import { Users, Trophy, Globe, HeartHandshake, Facebook } from "lucide-react";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { sanitizeRichText, isRichTextEmpty } from "@/lib/rich-text";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [leadership, settings] = await Promise.all([db.getLeadership(), getSiteSettings()]);
  const { pages, brand } = settings;
  const siteName = brand.siteName.trim();
  const aboutHtml = isRichTextEmpty(pages.aboutHtml || "") ? "" : sanitizeRichText(pages.aboutHtml);

  // Members grouped by their Group (category), in sort order; groups keep the order they first appear.
  const groups: { name: string; members: any[] }[] = [];
  for (const m of leadership as any[]) {
    const name = (m.category || "").trim() || "Team";
    let g = groups.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (!g) groups.push((g = { name, members: [] }));
    g.members.push(m);
  }

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0B0C0F] text-white">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(60%_80%_at_50%_0%,#C79A3B_0%,transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-wider text-[#F7DC8B]">
            <Globe className="w-3.5 h-3.5" /> About {siteName}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{pages.aboutTitle}</h1>
          {pages.aboutIntro && <p className="text-sm sm:text-base text-white/75 leading-relaxed whitespace-pre-line max-w-2xl mx-auto">{pages.aboutIntro}</p>}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 -mt-6 sm:-mt-8 relative">
        {/* Written by the admins */}
        {aboutHtml && (
          <section className="p-5 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="rich-content text-sm sm:text-[15px] max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: aboutHtml }} />
          </section>
        )}

        {/* What the platform does */}
        <section className={`grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 ${aboutHtml ? "" : "pt-0"}`}>
          {[
            { icon: Trophy, title: "Fair Results", text: "Every official result is checked by the admin team before it counts. Player and club ratings update automatically after each approved match." },
            { icon: Users, title: "Clubs & Transfers", text: "Clubs build a 30-player Main Team Squad. Signings go through the Transfer Window with a 120-day contract and admin approval, and every move is kept in the player's history." },
            { icon: HeartHandshake, title: "Player Profiles", text: "Every player gets a public profile with their Konami ID, device, club, contract, transfer history and match record." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#0B0C0F] flex items-center justify-center text-[#F7DC8B]">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-950">{title}</h3>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </section>

        {/* Management team */}
        {groups.length > 0 && (
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#C79A3B]">
                <span className="w-6 h-px bg-[#C79A3B]" /> Management <span className="w-6 h-px bg-[#C79A3B]" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">{pages.teamTitle || "Our Management Team"}</h2>
              {pages.teamSubtitle && <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">{pages.teamSubtitle}</p>}
            </div>

            {groups.map((g) => (
              <div key={g.name} className="space-y-4">
                {groups.length > 1 && (
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 shrink-0">{g.name}</h3>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {g.members.map((m) => (
                    <article key={m.id} className="group rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                      <div className="relative aspect-square bg-slate-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.photo} alt={m.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                        {m.role && (
                          <span className="absolute left-2.5 bottom-2.5 right-2.5 inline-block w-fit max-w-full truncate px-2.5 py-1 rounded-full bg-[#C79A3B] text-[10px] sm:text-[11px] font-black text-black">
                            {m.role}
                          </span>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm sm:text-base font-black text-slate-950 leading-tight break-words">{m.name}</h4>
                          {m.facebook && (
                            <a href={m.facebook} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${m.name} on Facebook`} className="shrink-0 w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center">
                              <Facebook className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {m.period && <div className="text-[10px] font-mono text-slate-400">{m.period}</div>}
                        {m.bio && <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed line-clamp-4">{m.bio}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
