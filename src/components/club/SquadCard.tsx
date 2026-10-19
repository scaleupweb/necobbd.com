import Link from "next/link";
import { Facebook, FileSignature, Smartphone, ArrowUpRight } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { FreezeChip } from "@/components/ui/FreezeCountdown";
import { CONTRACT_DAYS, isFrozen, ratingText } from "@/lib/squad";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

const DAY = 86400000;
const short = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });

/** Contract progress for a squad player: days served, days left, dates. */
function contractOf(p: any) {
  const end = p.contract?.endDate ? new Date(p.contract.endDate) : null;
  if (!end) return null;
  const start = p.contract?.startDate ? new Date(p.contract.startDate) : new Date(end.getTime() - CONTRACT_DAYS * DAY);
  const total = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY));
  const served = Math.min(total, Math.max(0, Math.floor((Date.now() - start.getTime()) / DAY)));
  const left = Math.max(0, Math.ceil((end.getTime() - Date.now()) / DAY));
  const tone = left <= 7 ? "rose" : left <= 30 ? "amber" : "emerald";
  return { start, end, total, served, left, pct: Math.round((served / total) * 100), tone };
}

const TONES = {
  emerald: { bar: "from-emerald-400 to-emerald-600", text: "text-emerald-700", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  amber: { bar: "from-amber-300 to-amber-500", text: "text-amber-700", chip: "bg-amber-50 text-amber-800 border-amber-200" },
  rose: { bar: "from-rose-400 to-rose-600", text: "text-rose-700", chip: "bg-rose-50 text-rose-700 border-rose-200" },
} as const;

/**
 * One player in a club's Main Team Squad: identity, contract progress and record.
 * Compact horizontal card (photo on the left) so a 30-player squad stays short on phones.
 */
export function SquadCard({ p, captain = false }: { p: any; captain?: boolean }) {
  const c = contractOf(p);
  const t = c ? TONES[c.tone as keyof typeof TONES] : null;
  const s = p.stats || {};

  return (
    <div className="group relative rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-[#C79A3B]/60 transition-all duration-300">
      {/* Gold accent + faint seat number */}
      <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#F7DC8B] via-[#C79A3B] to-[#8a6420]" />
      {p.seat ? (
        <span aria-hidden className="absolute right-2 top-1 text-[44px] leading-none font-black text-slate-900/[0.04] font-mono select-none">
          {String(p.seat).padStart(2, "0")}
        </span>
      ) : null}

      <div className="relative p-3 pl-4 space-y-2.5">
        {/* Photo + identity */}
        <div className="flex items-start gap-3">
          <Link href={`/players/${p.username}`} className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F7DC8B] via-[#C79A3B] to-[#8a6420] p-[2px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.avatar} alt={p.fullName} loading="lazy" className="w-full h-full rounded-full object-cover bg-slate-100 ring-2 ring-white" />
            </span>
            {p.shirtNo ? (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 rounded-full bg-[#0B0C0F] text-[#F7DC8B] text-[10px] font-black font-mono ring-2 ring-white leading-[18px]">#{p.shirtNo}</span>
            ) : null}
            {captain && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#C79A3B] text-black text-[9px] font-black flex items-center justify-center ring-2 ring-white" title="Captain">
                C
              </span>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <Link href={`/players/${p.username}`} className="flex items-center gap-1 text-sm sm:text-[15px] font-black text-slate-950 hover:underline min-w-0">
              <span className="truncate">{p.fullName}</span>
              {p.isVerified && <VerifiedBadge className="w-4 h-4 shrink-0" />}
            </Link>
            <div className="flex items-center gap-0.5 min-w-0">
              <span className="text-[11px] text-slate-500 font-mono truncate">@{p.username}</span>
              <CopyButton value={p.username} label="Username copied" className="!w-5 !h-5 !border-0 !bg-transparent shrink-0" />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className="px-1.5 py-0.5 rounded-md bg-[#0B0C0F] text-[#F7DC8B] text-[10px] font-black font-mono">★ {ratingText(p)}</span>
              {p.preferredPosition && <span className="px-1.5 py-0.5 rounded-md bg-[#C79A3B] text-black text-[10px] font-black">{p.preferredPosition}</span>}
              {p.seat ? <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black">Seat {p.seat}</span> : null}
              {isFrozen(p.frozenUntil) && <FreezeChip until={p.frozenUntil} />}
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-1.5">
            <Link href={`/players/${p.username}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white hover:bg-black" aria-label={`${p.fullName}'s profile`} title="Profile">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            {p.facebookProfile && (
              <a
                href={p.facebookProfile}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                aria-label={`${p.fullName} on Facebook`}
                title="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* UID + device on one line */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-[11px] min-w-0">
          <span className="text-slate-400 font-bold shrink-0">UID</span>
          <span className="font-black font-mono text-slate-800 truncate">{p.konamiId || "—"}</span>
          {p.konamiId && <CopyButton value={p.konamiId} label="UID copied" className="!w-5 !h-5 !border-0 !bg-transparent shrink-0" />}
          <span className="ml-auto flex items-center gap-1 min-w-0 text-slate-600 font-bold">
            <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate max-w-[110px]">{p.deviceModel || "—"}</span>
          </span>
        </div>

        {/* Contract bar + match record on one row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="inline-flex items-center gap-1 font-black uppercase tracking-wider text-slate-400 min-w-0">
                <FileSignature className="w-3 h-3 shrink-0" /> {c ? <span className="truncate">Day {c.served}<span className="font-semibold normal-case tracking-normal">/{c.total}</span></span> : "Contract"}
              </span>
              {c && t ? (
                <span className={`px-1.5 py-px rounded-md border font-black shrink-0 ${t.chip}`} title={`${short(c.start)} → ${short(c.end)}`}>
                  {c.left ? `${c.left}d left` : "Ends today"}
                </span>
              ) : (
                <span className="font-bold text-slate-400 shrink-0">No dates</span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              {c && t && <div className={`h-full rounded-full bg-gradient-to-r ${t.bar}`} style={{ width: `${Math.max(3, c.pct)}%` }} />}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            {[
              ["M", s.matchesPlayed || 0],
              ["W", s.wins || 0],
              ["GF", s.goalsScored || 0],
            ].map(([k, v]) => (
              <div key={k} className="w-9 rounded-lg bg-slate-50 py-0.5 text-center">
                <div className="text-xs font-black font-mono text-slate-900 leading-tight">{v}</div>
                <div className="text-[8px] font-bold text-slate-400 leading-tight">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
