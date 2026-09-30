import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Shared homepage section heading: icon badge, title, subtitle and a "View all" pill. */
export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  href,
  dark,
  accent = "bg-black text-white",
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
  return (
    <div className="flex items-end justify-between gap-4 mb-4 sm:mb-5">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${dark ? "bg-white/10 text-[#FBBF24]" : accent}`}>
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className={`text-lg sm:text-2xl font-black tracking-tight truncate ${dark ? "text-white" : "text-[#111111]"}`}>{title}</h2>
            {badge}
          </div>
          {subtitle && <p className={`text-xs sm:text-sm ${dark ? "text-white/50" : "text-[#6B7280]"}`}>{subtitle}</p>}
        </div>
      </div>
      {href && (
        <Link
          href={href}
          className={`shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
            dark ? "bg-white/10 text-white hover:bg-white hover:text-black" : "bg-white border border-[#E5E7EB] text-[#111111] hover:bg-black hover:text-white hover:border-black"
          }`}
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
