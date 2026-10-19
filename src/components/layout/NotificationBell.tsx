"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CheckCheck, Loader2, ArrowRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

/**
 * Bell in the navbar that opens a small notifications panel in place, instead of
 * leaving the page. Opening it marks everything as read; items that were new stay
 * highlighted until the panel closes.
 */
export function NotificationBell({ unread, onRead }: { unread: number; onRead: () => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[] | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    setItems(null);
    try {
      const j = await fetch("/api/notifications", { cache: "no-store" }).then((r) => r.json());
      const list: any[] = j.success ? j.data : [];
      setItems(list.slice(0, 30));
      const newOnes = list.filter((n) => !n.read);
      setFresh(new Set(newOnes.map((n) => String(n.id))));
      if (newOnes.length) {
        await fetch("/api/notifications", { method: "POST" });
        onRead();
      }
    } catch {
      setItems([]);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${open ? "bg-[#F7F8FA] text-[#111111]" : "text-[#5F6368] hover:text-[#111111] hover:bg-[#F7F8FA]"}`}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[64px] sm:top-11 z-[70] sm:w-[380px] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <Bell className="w-4 h-4" /> Notifications
            </div>
            {fresh.size > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <CheckCheck className="w-3.5 h-3.5" /> {fresh.size} new
              </span>
            )}
          </div>

          <div className="max-h-[min(70vh,480px)] overflow-y-auto">
            {items === null ? (
              <div className="py-10 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">No notifications yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => {
                  const isNew = fresh.has(String(n.id));
                  const body = (
                    <div className={`flex items-start gap-2.5 px-4 py-3 ${isNew ? "bg-amber-50/60" : ""} ${n.link ? "hover:bg-slate-50" : ""}`}>
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isNew ? "bg-amber-500" : "bg-slate-200"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-slate-950 leading-snug">{n.title}</div>
                        {n.message && <p className="text-xs text-slate-600 mt-0.5 leading-snug break-words">{n.message}</p>}
                        <div className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(n.createdAt)}</div>
                      </div>
                      {n.link && <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />}
                    </div>
                  );
                  return <li key={n.id}>{n.link ? <Link href={n.link} onClick={() => setOpen(false)}>{body}</Link> : body}</li>;
                })}
              </ul>
            )}
          </div>

          <Link href="/notifications" onClick={() => setOpen(false)} className="block px-4 py-2.5 border-t border-slate-100 text-center text-xs font-bold text-slate-700 hover:bg-slate-50">
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
