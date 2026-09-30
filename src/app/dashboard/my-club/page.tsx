"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, ArrowRightLeft, Swords, Plus, Pencil, Loader2, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ImageInput } from "@/components/ui/ImageInput";
import { LocationInput } from "@/components/ui/LocationInput";
import { FitImage } from "@/components/ui/FitImage";

const ACCESS_LABEL: Record<string, string> = {
  MANAGER: "Club Manager",
  FULL: "Club Moderator · full control",
  INFO: "Club Moderator · info only",
};

export default function MyClubDashboard() {
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const loadClub = useCallback(async () => {
    try {
      const res = await fetch("/api/me/club", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setClub(json.data);
      else setError(json.error?.message || "Could not load your club");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClub();
  }, [loadClub]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-600 font-bold animate-pulse">
        Loading Club Management Portal...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <h1 className="text-xl font-black text-slate-950">No club yet</h1>
        <p className="text-sm text-slate-600">{error || "You are not attached to a club."}</p>
        <Link href="/clubs" className="inline-block px-4 py-2 rounded-xl bg-black text-white text-xs font-bold">Browse clubs</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {club.status === "PENDING" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          <strong>Waiting for approval.</strong> An admin will review your club soon. Once approved it will appear on the Clubs page and you can enter tournaments.
        </div>
      )}
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="relative h-32 sm:h-44 bg-[#0F1012]">
          <FitImage src={club.banner} />
          <div className="absolute top-3 right-3 flex gap-2">
            <Link href={`/clubs/${club.slug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-black text-xs font-bold hover:bg-white">
              <ExternalLink className="w-3.5 h-3.5" /> Public page
            </Link>
            {club.canEdit && (
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800">
                <Pencil className="w-3.5 h-3.5" /> Edit club profile
              </button>
            )}
          </div>
        </div>
        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={club.logo}
              alt=""
              className="-mt-14 relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
            />
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-900 border border-slate-200 text-[10px] font-bold uppercase mb-1">
                <span>{club.access ? ACCESS_LABEL[club.access] : "Club Member"}</span>
                <span>•</span>
                <span>{club.shortName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950">{club?.name}</h1>
              {club.slogan && <div className="text-xs text-slate-600 italic">“{club.slogan}”</div>}
              <div className="text-xs text-slate-500">{club.location}{club.managerName ? ` • Manager: ${club.managerName}` : ""}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">League Points</div>
              <div className="text-2xl font-black text-slate-950 font-mono">{club?.points} PTS</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Club Value</div>
              <div className="text-2xl font-black text-emerald-700 font-mono">{formatCurrency(club.marketValue)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Squad Management List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center">
            <Users className="w-4 h-4 text-black mr-2" />
            Active Squad Lineup ({club?.squad?.length || 0} Athletes)
          </h2>
          <Link
            href="/transfer-market"
            className="px-4 py-2 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Scout / Sign Player</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {club?.squad?.map((p: any) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-black transition-all"
            >
              <div className="flex items-center space-x-3">
                <img src={p.avatar} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                <div>
                  <div className="text-xs font-bold text-slate-950 truncate max-w-[120px]">{p.fullName}</div>
                  <div className="text-[11px] text-slate-500">{p.preferredPosition} • UID: {p.konamiId}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">{(p.contract?.status || "").replace(/_/g, " ")}</div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">{p.rating}</div>
                <Link href={`/players/${p.username}`} className="text-[10px] text-slate-950 font-bold hover:underline block">
                  Profile →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {club.fixtures?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center">
            <Swords className="w-4 h-4 text-black mr-2" /> Club fixtures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {club.fixtures.map((f: any) => (
              <Link key={f.id} href={`/matches/${f.id}`} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-black flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-950 truncate">{f.homeClub?.name || f.homePlayer?.fullName} vs {f.awayClub?.name || f.awayPlayer?.fullName}</div>
                  <div className="text-[11px] text-slate-500">{new Date(f.scheduledDate).toLocaleString()}</div>
                </div>
                <span className="text-xs font-black font-mono">{f.result ? `${f.result.homeScore} - ${f.result.awayScore}` : f.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {club.isManager && club.offers?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center">
            <ArrowRightLeft className="w-4 h-4 text-black mr-2" /> Transfer offers you made
          </h2>
          <div className="space-y-2">
            {club.offers.map((o: any) => (
              <div key={o.id} className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold">{o.player?.fullName}</span>
                <span className="font-mono">{formatCurrency(o.offeredFee)}</span>
                <span className={`px-2 py-0.5 rounded font-bold ${o.status === "PENDING" ? "bg-amber-50 text-amber-800" : o.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{o.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && <EditClubProfile club={club} onClose={() => setEditing(false)} onSaved={loadClub} />}
    </div>
  );
}

function EditClubProfile({ club, onClose, onSaved }: { club: any; onClose: () => void; onSaved: () => void }) {
  const clean = (v?: string) => (v && !v.startsWith("/images/placeholders") && !v.startsWith("/api/crest/") ? v : "");
  const [f, setF] = useState({
    logo: clean(club.logo),
    banner: clean(club.banner),
    slogan: club.slogan || "",
    location: club.location || "",
    facebookPage: club.facebookPage || "",
    description: club.description || "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const input =
    "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-black focus:bg-white text-xs";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/me/club", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Save failed");
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto" onMouseDown={onClose}>
      <form
        onSubmit={save}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 text-xs my-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-950">Edit club profile</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-800" aria-label="Close">
            ✕
          </button>
        </div>
        {err && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{err}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageInput label="Club logo" value={f.logo} onChange={(v) => setF({ ...f, logo: v })} />
          <ImageInput label="Cover / poster" value={f.banner} onChange={(v) => setF({ ...f, banner: v })} aspect="wide" />
          <label className="block space-y-1">
            <span className="block text-slate-700 font-bold">Slogan</span>
            <input className={input} value={f.slogan} onChange={(e) => setF({ ...f, slogan: e.target.value })} maxLength={120} />
          </label>
          <label className="block space-y-1">
            <span className="block text-slate-700 font-bold">Location</span>
            <LocationInput className={input} value={f.location} onChange={(v) => setF({ ...f, location: v })} />
          </label>
          <label className="sm:col-span-2 block space-y-1">
            <span className="block text-slate-700 font-bold">Facebook page</span>
            <input className={input} value={f.facebookPage} onChange={(e) => setF({ ...f, facebookPage: e.target.value })} placeholder="https://facebook.com/…" />
          </label>
          <label className="sm:col-span-2 block space-y-1">
            <span className="block text-slate-700 font-bold">About the club</span>
            <textarea className={input} rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={1000} />
          </label>
        </div>
        <p className="text-[11px] text-slate-500">Club name and tag can only be changed by an admin.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 font-bold">
            Cancel
          </button>
          <button disabled={busy} className="px-5 py-2 rounded-xl bg-black text-white font-bold inline-flex items-center gap-1.5 disabled:opacity-60">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
          </button>
        </div>
      </form>
    </div>
  );
}
