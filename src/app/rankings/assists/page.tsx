"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Zap, ArrowLeft } from "lucide-react";
import { noClubLabel } from "@/lib/squad";

export default function AssistsRankingPage() {
  const [assists, setAssists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssists() {
      try {
        const res = await fetch("/api/rankings?type=assists");
        const json = await res.json();
        if (json.success) setAssists(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAssists();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link href="/rankings" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-black">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Rankings Hub</span>
      </Link>

      <div className="flex items-center space-x-3 pb-6 border-b border-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center text-black">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-black">Playmaker Leaderboard: Top Assists</h1>
          <p className="text-xs text-slate-500">Assists recorded in approved official matches.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-600 font-bold animate-pulse text-xs">Loading Playmaker Standings...</div>
      ) : assists.length === 0 ? (
        <EmptyState icon={Zap} title="No assists yet" text="Assists appear here after the first approved official match." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Athlete</th>
                <th className="py-3.5 px-4">Club</th>
                <th className="py-3.5 px-4 text-center">Position</th>
                <th className="py-3.5 px-4 text-center">Matches</th>
                <th className="py-3.5 px-4 text-right">Total Assists</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {assists.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{idx + 1}</td>
                  <td className="py-3.5 px-4">
                    <Link href={`/players/${p.username}`} className="flex items-center space-x-3 group-hover:underline">
                      <img src={p.avatar} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200 p-0.5" />
                      <div>
                        <div className="font-bold text-black">{p.fullName}</div>
                        <div className="text-[10px] text-slate-500">@{p.username}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{p.club?.name || noClubLabel(p)}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-black font-bold">{p.preferredPosition}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-700">{p.stats?.matchesPlayed || 0}</td>
                  <td className="py-3.5 px-4 text-right font-black text-black font-mono text-base">
                    {p.stats?.assists || 0} Assists
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
