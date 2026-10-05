"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Users,
  UserCog,
  Shield,
  Swords,
  Trophy,
  CalendarDays,
  ArrowRightLeft,
  Scale,
  AlertTriangle,
  FileText,
  ArrowLeft,
  ShieldAlert,
  LogOut,
  UserRound,
  Palette,
  Timer,
  Newspaper,
  Handshake,
} from "lucide-react";

type Item = { label: string; href: string; icon: any; roles?: string[] };

const ADMIN = ["SUPER_ADMIN", "ADMIN"];
const TOURNEY = ["SUPER_ADMIN", "ADMIN", "TOURNAMENT_OFFICIAL"];
const OFFICIALS = ["SUPER_ADMIN", "ADMIN", "TOURNAMENT_OFFICIAL", "SENIOR_REFEREE", "REFEREE"];
const DISCIPLINE = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SENIOR_REFEREE"];

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Website",
    items: [
      { label: "Homepage & Site Content", href: "/admin/site", icon: Palette, roles: ADMIN },
      { label: "Registration Countdown", href: "/admin/countdown", icon: Timer, roles: TOURNEY },
      { label: "News", href: "/admin/news", icon: Newspaper, roles: ADMIN },
      { label: "Partners & Team", href: "/admin/partners", icon: Handshake, roles: ADMIN },
    ],
  },
  {
    title: "Competition",
    items: [
      { label: "Tournaments", href: "/admin/tournaments", icon: Trophy, roles: TOURNEY },
      { label: "Events", href: "/admin/events", icon: CalendarDays, roles: TOURNEY },
      { label: "Fixtures & Results", href: "/admin/fixtures", icon: Swords, roles: OFFICIALS },
      { label: "Live Match Desk", href: "/admin/live", icon: Radio, roles: OFFICIALS },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Users & Roles", href: "/admin/users", icon: UserCog, roles: ADMIN },
      { label: "Players", href: "/admin/players", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] },
      { label: "Clubs", href: "/admin/clubs", icon: Shield, roles: ADMIN },
      { label: "Match Officials", href: "/admin/referees", icon: Scale, roles: ADMIN },
    ],
  },
  {
    title: "Governance",
    items: [
      { label: "Transfers", href: "/admin/transfers", icon: ArrowRightLeft, roles: ADMIN },
      { label: "Disciplinary", href: "/admin/disciplinary", icon: AlertTriangle, roles: DISCIPLINE },
      { label: "Audit Log", href: "/admin/audit-logs", icon: FileText, roles: ADMIN },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) window.location.href = "/login?next=/admin";
        else setMe(j.data);
      })
      .catch(() => {});
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const allowed = (i: Item) => !i.roles || (me && (me.role === "SUPER_ADMIN" || i.roles.includes(me.role)));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 md:p-5 space-y-4 flex-shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-950">Admin Panel</div>
              <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">{me ? me.role.replace(/_/g, " ") : "…"}</div>
            </div>
          </div>
          <div className="md:hidden flex items-center gap-1.5">
            {me?.playerProfileId && (
              <Link href="/dashboard" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#F7DC8B] bg-[#0B0C0F]">
                <UserRound className="w-3.5 h-3.5" /> Profile
              </Link>
            )}
            <Link href="/" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200">
              <ArrowLeft className="w-3.5 h-3.5" /> Site
            </Link>
            <button onClick={logout} className="p-2 rounded-lg text-rose-600 bg-rose-50 border border-rose-100" aria-label="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar pb-1 md:pb-0">
          {GROUPS.map((g) => {
            const items = g.items.filter(allowed);
            if (!items.length) return null;
            return (
              <div key={g.title} className="flex md:block gap-1 md:space-y-1 md:pb-3">
                <div className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-1 pb-1">{g.title}</div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                        active ? "bg-black text-white shadow-sm" : "text-slate-600 hover:text-black hover:bg-slate-100"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-500"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="hidden md:block pt-3 border-t border-slate-100 space-y-2">
          {me && (
            <div className="px-3 text-[11px] text-slate-500 truncate">
              Signed in as <strong className="text-slate-900">{me.fullName}</strong>
            </div>
          )}
          {me?.playerProfileId && (
            <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#F7DC8B] bg-[#0B0C0F] hover:bg-black">
              <UserRound className="w-4 h-4" /> My player profile
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-black hover:bg-slate-100 border border-slate-200">
            <ArrowLeft className="w-4 h-4" /> Back to website
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 space-y-6">{children}</main>
    </div>
  );
}
