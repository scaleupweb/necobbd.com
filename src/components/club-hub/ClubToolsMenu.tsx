"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreVertical, X, LayoutGrid } from "lucide-react";
import { useClubHub } from "./ClubHubContext";
import { GROUPS, TOOLS, canOpen } from "./tools";

/** Phone/tablet: a ⋮ button that opens a bottom sheet with this club's tools (desktop has the sidebar). */
export function ClubToolsMenu({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  const { club } = useClubHub();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const tools = TOOLS.filter((t) => canOpen(t, club.access, club.permissions));

  // Close when a link is followed, and lock page scroll while open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const item = (href: string, active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${active ? "bg-[#C79A3B] text-black" : "text-slate-700 hover:bg-slate-100"}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Club tools menu"
        className={`lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
          dark ? "bg-white/10 text-white hover:bg-white/20 border border-white/15" : "bg-white text-slate-700 border border-slate-200 hover:border-slate-400"
        } ${className}`}
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {open &&
        createPortal(
        <div className="lg:hidden fixed inset-0" style={{ zIndex: 200 }}>
          <button aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={club.logo} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-slate-950 truncate">{club.name}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#B0852A]">Club tools</div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="overflow-y-auto p-3 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-4">
              <Link href="/dashboard/my-club" className={item("/dashboard/my-club", pathname === "/dashboard/my-club")}>
                <LayoutGrid className="w-4 h-4" /> Overview
              </Link>
              {GROUPS.map((g) => {
                const items = tools.filter((t) => t.group === g.id);
                if (!items.length) return null;
                return (
                  <div key={g.id}>
                    <div className={`px-3 pb-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${g.tone}`}>{g.label}</div>
                    <div className="space-y-0.5">
                      {items.map((t) => {
                        const href = `/dashboard/my-club/${t.slug}`;
                        return (
                          <Link key={t.slug} href={href} className={item(href, pathname === href)}>
                            <t.icon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 truncate">{t.label}</span>
                            {!t.ready && <span className="text-[9px] font-black uppercase text-slate-400">Soon</span>}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}
