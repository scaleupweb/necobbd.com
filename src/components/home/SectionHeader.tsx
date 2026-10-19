import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Shared homepage section heading, so every section looks like one family:
 * dark tile with a gold icon, title, subtitle, a gold rule and a "View all" pill.
 * `accent` is kept for old callers; only a red accent (live matches) changes the tile.
 */
export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  href,
  dark,
  accent = "",
  badge,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  href?: string;
  dark?: boolean;
  accent?: string;
  badge?: React.ReactNode;
}) {
  const live = /red-|rose-/.test(accent);
  return (
    <div className="mb-4 sm:mb-5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              live ? "bg-gradient-to-br from-rose-500 to-red-600 text-white" : dark ? "bg-white/10 text-[#F7DC8B]" : "bg-[#0B0C0F] text-[#F7DC8B] ring-1 ring-[#C79A3B]/30"
            }`}
          >
            {!live && !dark && <span aria-hidden className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(247,220,139,0.25),transparent_60%)]" />}
            <Icon className="relative w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className={`text-xl sm:text-[26px] font-black tracking-tight truncate leading-tight ${dark ? "text-white" : "text-[#111111]"}`}>{title}</h2>
              {badge}
            </div>
            {subtitle && <p className={`text-xs sm:text-sm truncate ${dark ? "text-white/50" : "text-[#6B7280]"}`}>{subtitle}</p>}
          </div>
        </div>
        {href && (
          <Link
            href={href}
            className={`group shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-black transition-colors ${
              dark ? "bg-white/10 text-white hover:bg-white hover:text-black" : "bg-[#0B0C0F] text-white hover:bg-black"
            }`}
          >
            View all <ArrowRight className="w-3.5 h-3.5 text-[#F7DC8B] transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      <div aria-hidden className={`mt-3 h-px ${dark ? "bg-gradient-to-r from-[#C79A3B]/60 via-white/10 to-transparent" : "bg-gradient-to-r from-[#C79A3B]/70 via-slate-200 to-transparent"}`} />
    </div>
  );
}
