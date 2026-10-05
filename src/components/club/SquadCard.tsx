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

/** One player in a club's Main Team Squad: identity, contract progress and record. */
export function SquadCard({ p, captain = false }: { p: any; captain?: boolean }) {
  const c = contractOf(p);
  const t = c ? TONES[c.tone as keyof typeof TONES] : null;
  const s = p.stats || {};

  return (
    <div className="group relative flex flex-col rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-[#C79A3B]/60 transition-all duration-300">
      {/* Header band */}
      <div className="relative h-[72px] bg-[#0B0C0F] overflow-hidden">
        <div aria-hidden className="absolute -top-10 -left-6 w-40 h-40 rounded-full bg-[#C79A3B]/30 blur-3xl" />
        <div aria-hidden className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(135deg,#fff_1px,transparent_1px)] [background-size:12px_12px]" />
        {p.seat ? (
          <span aria-hidden className="absolute -right-1 -bottom-4 text-[64px] leading-none font-black text-white/[0.07] font-mono select-none">
            {String(p.seat).padStart(2, "0")}
          </span>
        ) : null}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/10 text-[#F7DC8B] text-[10px] font-black font-mono">★ {ratingText(p)}</span>
          <span className="flex items-center gap-1">
            {p.seat ? <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/80 text-[10px] font-black">Seat {p.seat}</span> : null}
            <span className="px-1.5 py-0.5 rounded-md bg-[#C79A3B] text-black text-[10px] font-black">{p.preferredPosition}</span>
          </span>
        </div>
      </div>

      {/* Avatar */}
      <Link href={`/players/${p.username}`} className="relative mx-auto -mt-11 block w-[88px] h-[88px] sm:w-24 sm:h-24">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F7DC8B] via-[#C79A3B] to-[#8a6420] p-[3px] shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.avatar} alt={p.fullName} loading="lazy" className="w-full h-full rounded-full object-cover bg-slate-100 ring-[3px] ring-white" />
        </span>
        {p.shirtNo ? (
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0B0C0F] text-[#F7DC8B] text-[11px] font-black font-mono ring-2 ring-white">#{p.shirtNo}</span>
        ) : null}
        {captain && (
          <span className="absolute top-0 -right-1 w-6 h-6 rounded-full bg-[#C79A3B] text-black text-[10px] font-black flex items-center justify-center ring-2 ring-white" title="Captain">
            C
          </span>
        )}
      </Link>

      <div className="flex-1 flex flex-col px-3 sm:px-4 pb-3 sm:pb-4 text-center">
        {/* Name */}
        <Link href={`/players/${p.username}`} className="mt-3 flex items-center justify-center gap-1 text-sm sm:text-base font-black text-slate-950 hover:underline min-w-0">
          <span className="truncate">{p.fullName}</span>
          {p.isVerified && <VerifiedBadge className="w-[18px] h-[18px]" />}
        </Link>
        <div className="mt-0.5 flex items-center justify-center gap-1 min-w-0">
          <span className="text-[11px] text-slate-500 font-mono truncate">@{p.username}</span>
          <CopyButton value={p.username} label="Username copied" className="!w-5 !h-5 !border-0 !bg-transparent shrink-0" />
        </div>
        {isFrozen(p.frozenUntil) && (
          <div className="mt-1.5">
            <FreezeChip until={p.frozenUntil} />
          </div>
        )}

        {/* UID + device */}
        <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 text-[11px] text-left">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 min-w-0">
            <span className="text-slate-400 font-bold shrink-0">UID</span>
            <span className="flex-1 font-black font-mono text-slate-800 truncate text-right">{p.konamiId || "—"}</span>
            {p.konamiId && <CopyButton value={p.konamiId} label="UID copied" className="!w-5 !h-5 !border-0 !bg-transparent shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 min-w-0">
            <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="flex-1 font-bold text-slate-800 truncate text-right">{p.deviceModel || "—"}</span>
          </div>
        </div>

        {/* Contract */}
        <div className="mt-2.5 rounded-xl border border-slate-200 p-2.5 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <FileSignature className="w-3 h-3" /> Contract
            </span>
            {c && t ? (
              <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-black ${t.chip}`}>{c.left ? `${c.left}d left` : "Ends today"}</span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400">No dates</span>
            )}
          </div>
          {c && t && (
            <>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${t.bar}`} style={{ width: `${Math.max(3, c.pct)}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                <span className="font-black text-slate-700">
                  Day {c.served} <span className="font-semibold text-slate-400">of {c.total}</span>
                </span>
                <span className="text-slate-400 font-semibold">
                  {short(c.start)} → {short(c.end)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Record */}
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          {[
            ["M", s.matchesPlayed || 0],
            ["W", s.wins || 0],
            ["GF", s.goalsScored || 0],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-slate-50 py-1">
              <div className="text-sm font-black font-mono text-slate-900 leading-tight">{v}</div>
              <div className="text-[9px] font-bold text-slate-400">{k}</div>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
          {p.facebookProfile && (
            <a
              href={p.facebookProfile}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shrink-0"
              aria-label={`${p.fullName} on Facebook`}
            >
              <Facebook className="w-3.5 h-3.5" />
            </a>
          )}
          <Link href={`/players/${p.username}`} className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-lg bg-slate-900 text-white text-[11px] font-black hover:bg-black">
            Profile <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
