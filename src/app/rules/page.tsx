import Link from "next/link";
import { Scale, ShieldCheck, Swords, AlertTriangle } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { RANKING_FORMULA_CONFIG } from "@/lib/constants";
import { SQUAD_LIMIT, CONTRACT_DAYS, FREEZE_DAYS } from "@/lib/squad";
import { sanitizeRichText, isRichTextEmpty } from "@/lib/rich-text";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const { pages, brand } = await getSiteSettings();
  // Rulebook from the admin rich-text editor; older plain-text rules are the fallback.
  const html = isRichTextEmpty(pages.rulesHtml || "") ? "" : sanitizeRichText(pages.rulesHtml);
  const custom = html ? "" : pages.rulesContent.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 text-center space-y-2">
        <div className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
          <Scale className="w-4 h-4 text-black" />
          <span>Rules</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
          Rulebook & <span className="text-slate-500">Fair Play Charter</span>
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          How official {brand.siteName.trim()} matches, transfers, ratings and fair play work.
        </p>
      </div>

      {html && (
        <div className="p-5 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="rich-content text-sm sm:text-[15px]" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}

      {custom && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-slate-700 text-sm leading-relaxed space-y-4">
          {custom.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))}
        </div>
      )}

      {/* Rules Sections (default rulebook, shown until the admin writes their own) */}
      {!custom && !html && (
      <div className="space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
        
        {/* Section 1 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-950 flex items-center">
            <ShieldCheck className="w-5 h-5 text-black mr-2" />
            1. Accounts & Konami ID
          </h2>
          <p>
            One account per person. Register with your real Konami UID and the device you play on, and keep them up to date. A player can be registered with only one club at a time.
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-950 flex items-center">
            <Swords className="w-5 h-5 text-black mr-2" />
            2. Squads, Contracts & Transfers
          </h2>
          <p>
            Each club has a Main Team Squad of up to {SQUAD_LIMIT} players. Clubs sign players through the Transfer Window with a Facebook announcement post, and every signing needs admin approval. A signing starts a {CONTRACT_DAYS}-day contract, and the player is frozen for {FREEZE_DAYS} days after joining. When the contract ends without renewal, the player becomes a free agent.
          </p>
        </div>

        {/* Section 3 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-950 flex items-center">
            <Scale className="w-5 h-5 text-black mr-2" />
            3. Results, Ratings & Rankings
          </h2>
          <p>
            A result counts only after it is approved by the admin team or a match official. Every player starts on a rating of {RANKING_FORMULA_CONFIG.BASE_RATING}. After each approved match the rating moves using an Elo formula (K-factor {RANKING_FORMULA_CONFIG.RATING_K_FACTOR}): beating a stronger opponent earns more, and goal difference, clean sheets and Man of the Match awards add a little extra. Players and clubs appear in the rankings once they have played.
          </p>
        </div>

        {/* Section 4 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-950 flex items-center">
            <AlertTriangle className="w-5 h-5 text-rose-600 mr-2" />
            4. Fair Play
          </h2>
          <p>
            Cheating, fake match proof, using someone else&apos;s account and abusive behaviour are not allowed. The admin team can issue warnings, match bans or suspensions, and every decision is listed on the public Disciplinary page.
          </p>
        </div>

      </div>
      )}

    </div>
  );
}
