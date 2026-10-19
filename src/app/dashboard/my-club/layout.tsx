"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Lock, Loader2, ExternalLink } from "lucide-react";
import { ClubHubContext } from "@/components/club-hub/ClubHubContext";
import { GROUPS, TOOLS, canOpen } from "@/components/club-hub/tools";

const ACCESS_LABEL: Record<string, string> = {
  MANAGER: "Main manager",
  FULL: "Moderator · full control",
  CUSTOM: "Staff · custom access",
};

export default function MyClubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [club, setClub] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/me/club", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setClub(json.data);
        setError("");
      } else setError(json.error?.message || "Could not load your club");
    } catch {
      setError("Could not load your club. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!club) {
    return (
      <Notice title="No club yet" text={error || "You are not attached to a club."}>
        <Link href="/register?type=club" className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold">Register a club</Link>
        <Link href="/clubs" className="px-4 py-2 rounded-xl bg-slate-100 text-slate-900 text-xs font-bold">Browse clubs</Link>
      </Notice>
    );
  }

  if (!club.access) {
    return (
      <Notice title="Club managers only" text={`Club Control Center is for the managers of ${club.name}. Ask your club manager if you need access.`} locked>
        <Link href={`/clubs/${club.slug}`} className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold">View club page</Link>
      </Notice>
    );
  }

  const tools = TOOLS.filter((t) => canOpen(t, club.access, club.permissions));

  return (
    <ClubHubContext.Provider value={{ club, reload }}>
      <div className="bg-[#F4F5F7] min-h-[calc(100vh-4rem)]">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 grid lg:grid-cols-[264px_1fr] gap-5 items-start">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:flex flex-col sticky top-20 max-h-[calc(100vh-6rem)] rounded-3xl bg-[#0B0C0F] text-white overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={club.logo} alt="" className="w-11 h-11 rounded-xl object-cover bg-white" />
                <div className="min-w-0">
                  <div className="text-sm font-black truncate">{club.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#C79A3B]">{ACCESS_LABEL[club.access]}</div>
                </div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
              <SideLink href="/dashboard/my-club" active={pathname === "/dashboard/my-club"} icon={LayoutGrid} label="Overview" />
              {GROUPS.map((g) => {
                const items = tools.filter((t) => t.group === g.id);
                if (!items.length) return null;
                return (
                  <div key={g.id}>
                    <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{g.label}</div>
                    <div className="space-y-0.5">
                      {items.map((t) => (
                        <SideLink
                          key={t.slug}
                          href={`/dashboard/my-club/${t.slug}`}
                          active={pathname === `/dashboard/my-club/${t.slug}`}
                          icon={t.icon}
                          label={t.label}
                          soon={!t.ready}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>
            <Link href={`/clubs/${club.slug}`} className="m-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-xs font-bold hover:bg-white/15">
              <ExternalLink className="w-3.5 h-3.5" /> Public club page
            </Link>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </ClubHubContext.Provider>
  );
}

function SideLink({ href, active, icon: Icon, label, soon }: { href: string; active: boolean; icon: any; label: string; soon?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
        active ? "bg-[#C79A3B] text-black" : "text-white/70 hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate flex-1">{label}</span>
      {soon && <span className={`text-[9px] font-black uppercase ${active ? "text-black/60" : "text-white/30"}`}>Soon</span>}
    </Link>
  );
}

function Notice({ title, text, locked, children }: { title: string; text: string; locked?: boolean; children?: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
      {locked && (
        <span className="mx-auto w-12 h-12 rounded-2xl bg-slate-900 text-[#C79A3B] flex items-center justify-center">
          <Lock className="w-5 h-5" />
        </span>
      )}
      <h1 className="text-xl font-black text-slate-950">{title}</h1>
      <p className="text-sm text-slate-600">{text}</p>
      <div className="flex justify-center gap-2 pt-1">{children}</div>
    </div>
  );
}
