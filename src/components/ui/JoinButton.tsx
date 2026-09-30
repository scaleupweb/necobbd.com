"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

/**
 * Join/leave button for tournaments and events. `endpoint` is the
 * POST (join) / DELETE (leave) route, e.g. /api/tournaments/<slug>/join.
 */
export function JoinButton({
  endpoint,
  memberIds,
  memberClubIds = [],
  isOpen,
  joinLabel = "Join Now",
  leaveLabel = "Withdraw",
  closedLabel = "Registration Closed",
  allowLeave = true,
  className = "",
}: {
  endpoint: string;
  memberIds: string[];
  /** For club tournaments: clubs already entered (compared with the viewer's club). */
  memberClubIds?: string[];
  isOpen: boolean;
  joinLabel?: string;
  leaveLabel?: string;
  closedLabel?: string;
  allowLeave?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string } | null | undefined>(undefined);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        setMe(j.success ? j.data : null);
        if (j.success) setJoined(memberIds.includes(j.data.id) || (!!j.data.clubId && memberClubIds.includes(j.data.clubId)));
      })
      .catch(() => setMe(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberIds.join(","), memberClubIds.join(",")]);

  const act = async (method: "POST" | "DELETE") => {
    if (!me) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (method === "DELETE" && !confirm("Withdraw your registration?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(endpoint, { method });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Request failed");
      setJoined(method === "POST");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const base = `w-full py-3 rounded-xl font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 min-h-[44px] ${className}`;

  if (joined) {
    return (
      <div className="space-y-2">
        <div className={`${base} bg-emerald-50 text-emerald-800 border border-emerald-200`}>
          <CheckCircle2 className="w-4 h-4" /> {memberClubIds.length ? "Your club is registered" : "You're registered"}
        </div>
        {allowLeave && isOpen && (
          <button onClick={() => act("DELETE")} disabled={busy} className="w-full text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50">
            {busy ? "Working…" : leaveLabel}
          </button>
        )}
        {error && <p className="text-xs text-rose-600 text-center">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => act("POST")}
        disabled={!isOpen || busy || me === undefined}
        className={`${base} ${isOpen ? "bg-black text-white hover:bg-zinc-800" : "bg-slate-100 text-slate-500 cursor-not-allowed"} disabled:opacity-70`}
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {isOpen ? (me === null ? `Sign in to ${joinLabel.toLowerCase()}` : joinLabel) : closedLabel}
      </button>
      {error && <p className="text-xs text-rose-600 text-center">{error}</p>}
    </div>
  );
}
