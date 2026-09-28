"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Users, Trophy, ArrowRightLeft, Swords, Plus, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function MyClubDashboard() {
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClub() {
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
    }
    loadClub();
  }, []);

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
      
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src={club.logo}
              alt=""
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-900 border border-slate-200 text-[10px] font-bold uppercase mb-1">
                <span>Manager Desk</span>
                <span>•</span>
                <span>{club.shortName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950">{club?.name}</h1>
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
    </div>
  );
}
