"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ArrowRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setItems(j.data);
        else if (j.error?.code === "UNAUTHORIZED") window.location.href = "/login?next=/notifications";
      })
      .finally(() => setLoading(false));
  }, []);

  const markAll = async () => {
    await fetch("/api/notifications", { method: "POST" });
    setItems((list) => list.map((n) => ({ ...n, read: true })));
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-2">
            <Bell className="w-6 h-6" /> Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">{unread ? `${unread} unread` : "You're all caught up"}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-sm text-slate-500 py-12 animate-pulse">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">No notifications yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className={`p-4 rounded-2xl border shadow-sm flex items-start gap-3 ${n.read ? "bg-white border-slate-200" : "bg-amber-50/40 border-amber-200"}`}>
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-slate-300" : "bg-amber-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-950">{n.title}</div>
                {n.message && <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>}
                <div className="text-[11px] text-slate-400 mt-1">{formatRelativeTime(n.createdAt)}</div>
              </div>
              {n.link && (
                <Link href={n.link} className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-black hover:underline">
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
