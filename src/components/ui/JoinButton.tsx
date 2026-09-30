"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast, confirmDialog } from "@/lib/feedback";

/**
 * Join/leave button for tournaments and events. `endpoint` is the
 * POST (join) / DELETE (leave) route, e.g. /api/tournaments/<slug>/join.
 * With `clubOnly`, only a club's main manager can register (their club).
 */
export function JoinButton({
  endpoint,
  memberIds,
  memberClubIds = [],
  clubOnly = false,
  isOpen,
  joinLabel = "Join Now",
  leaveLabel = "Withdraw",
  closedLabel = "Registration Closed",
  allowLeave = true,
  className = "",
}: {
  endpoint: string;
  memberIds: string[];
  /** For club tournaments: clubs already entered. */
  memberClubIds?: string[];
  clubOnly?: boolean;
  isOpen: boolean;
  joinLabel?: string;
  leaveLabel?: string;
  closedLabel?: string;
  allowLeave?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [me, setMe] = useState<any>(undefined);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        const u = j.success ? j.data : null;
        setMe(u);
        if (!u) return;
        if (clubOnly) {
          const clubId = u.managedClub?.id || u.clubId;
          setJoined(!!clubId && memberClubIds.includes(clubId));
        } else setJoined(memberIds.includes(u.id));
      })
      .catch(() => setMe(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberIds.join(","), memberClubIds.join(","), clubOnly]);

  const isManager = !!me?.managedClub;
  const ownClubEntered = clubOnly && isManager && memberClubIds.includes(me.managedClub.id);

  const act = async (method: "POST" | "DELETE") => {
    if (!me) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (method === "DELETE") {
      const ok = await confirmDialog({
        title: clubOnly ? "Withdraw your club?" : "Withdraw your registration?",
        text: "You can register again while registration is open.",
        confirmText: "Withdraw",
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Request failed");
      setJoined(method === "POST");
      toast.success(method === "POST" ? (clubOnly ? `${me.managedClub?.name || "Your club"} is registered!` : "You're registered!") : "Registration withdrawn");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const base = `w-full py-3 rounded-xl font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 min-h-[44px] ${className}`;

  if (joined) {
    return (
      <div className="space-y-2">
        <div className={`${base} bg-emerald-50 text-emerald-800 border border-emerald-200`}>
          <CheckCircle2 className="w-4 h-4" /> {clubOnly ? "Your club is registered" : "You're registered"}
        </div>
        {allowLeave && isOpen && (!clubOnly || ownClubEntered) && (
          <button onClick={() => act("DELETE")} disabled={busy} className="w-full text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50">
            {busy ? "Working…" : leaveLabel}
          </button>
        )}
      </div>
    );
  }

  // Signed-in but not a club's main manager: explain instead of offering a button that would fail.
  if (clubOnly && isOpen && me && !isManager) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1.5">
        <div className="flex items-center gap-1.5 font-black">
          <ShieldAlert className="w-4 h-4" /> Club registration only
        </div>
        <p>Only a club&apos;s main manager can register the club for this tournament. Ask your club manager, or create your own club.</p>
        <Link href="/register?type=club" className="inline-block font-bold underline">
          Create a club
        </Link>
      </div>
    );
  }

  return (
    <button
      onClick={() => act("POST")}
      disabled={!isOpen || busy || me === undefined}
      className={`${base} ${isOpen ? "bg-black text-white hover:bg-zinc-800" : "bg-slate-100 text-slate-500 cursor-not-allowed"} disabled:opacity-70`}
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {isOpen ? (me === null ? `Sign in to ${joinLabel.toLowerCase()}` : clubOnly && me?.managedClub ? `${joinLabel} · ${me.managedClub.name}` : joinLabel) : closedLabel}
    </button>
  );
}
