import Link from "next/link";
import { Scale, ShieldCheck, Swords, AlertTriangle } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const { pages } = await getSiteSettings();
  const custom = pages.rulesContent.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 text-center space-y-2">
        <div className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
          <Scale className="w-4 h-4 text-black" />
          <span>Official Competition Code</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
          Rulebook & <span className="text-slate-500">Fair Play Charter</span>
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          The regulatory framework governing official eFCOB fixtures, ranking algorithms, transfer eligibility, and disciplinary arbitration.
        </p>
      </div>

      {custom && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-slate-700 text-sm leading-relaxed space-y-4">
          {custom.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))}
        </div>
      )}

      {/* Rules Sections (default rulebook, shown until the admin writes their own) */}
      {!custom && (
      <div className="space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
        
        {/* Section 1 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-950 flex items-center">
            <ShieldCheck className="w-5 h-5 text-black mr-2" />
            1. Player Eligibility & Verified Konami IDs
          </h2>
          <p>
            Every athlete competing in official division matches must register their authentic Konami UID and primary device model. Athletes may only represent one official active club at any given time. Multi-accounting, device spoofing, or sharing accounts will result in immediate disqualification and a 6-month minimum suspension.
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-950 flex items-center">
            <Swords className="w-5 h-5 text-black mr-2" />
            2. Matchday Protocols & Score Verification
          </h2>
          <p>
            Official tournament matches are contested in 10-minute Authentic or Dream Team mode. At the conclusion of the match, both competitors must capture end-game screenshots (including scoreline, match statistics, and player performance ratings) and upload them to the assigned match official within 15 minutes.
          </p>
        </div>

        {/* Section 3 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-950 flex items-center">
            <Scale className="w-5 h-5 text-black mr-2" />
            3. Elo Rating & Ranking Calculation Methodology
          </h2>
          <p>
            Player ratings are calculated dynamically using an adjusted Elo formula with a K-factor of 32. Points awarded consider opponent strength, goal differential (+0.15 weight per goal), clean sheet defensive bonuses (+0.5), and official Man of the Match honors.
          </p>
        </div>

        {/* Section 4 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-950 flex items-center">
            <AlertTriangle className="w-5 h-5 text-rose-600 mr-2" />
            4. Disciplinary Penalties & Anti-Toxicity Code
          </h2>
          <p>
            Unsportsmanlike conduct in stream chats, intentional network disconnection, toxic messaging, or tampering with evidence will incur escalating sanctions ranging from official warning, 1-week match ban, season-long suspension, to permanent expulsion from the national ecosystem.
          </p>
        </div>

      </div>
      )}

    </div>
  );
}
