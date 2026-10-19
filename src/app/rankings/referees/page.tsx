"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Scale, Star, ArrowLeft, Shield } from "lucide-react";

export default function RefereeRankingsPage() {
  const [referees, setReferees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReferees() {
      try {
        const res = await fetch("/api/rankings?type=referees");
        const json = await res.json();
        if (json.success) setReferees(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReferees();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link href="/rankings" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-black">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Rankings Hub</span>
      </Link>

      <div className="flex items-center space-x-3 pb-6 border-b border-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-800">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-black">Match Official & Referee Performance Tiers</h1>
          <p className="text-xs text-slate-500">Match officials ranked by the matches they have handled.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-600 font-bold animate-pulse text-xs">Loading Referee Accreditations...</div>
      ) : referees.length === 0 ? (
        <EmptyState icon={Scale} title="No match officials yet" text="Officials appear here once the admin team adds them." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3.5 px-4">Official ID</th>
                <th className="py-3.5 px-4">Referee Name</th>
                <th className="py-3.5 px-4">Accreditation Tier</th>
                <th className="py-3.5 px-4 text-center">Matches Officiated</th>
                <th className="py-3.5 px-4 text-center">Completed Reports</th>
                <th className="py-3.5 px-4 text-center">Disputes Arbitrated</th>
                <th className="py-3.5 px-4 text-right">Integrity Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {referees.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-3.5 px-4 font-mono font-bold text-black">{r.officialId}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <img src={r.avatar} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200 p-0.5" />
                      <div>
                        <div className="font-bold text-black">{r.name}</div>
                        <div className="text-[10px] text-slate-500">{r.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.tier === "TIER_1" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                      r.tier === "TIER_2" ? "bg-slate-100 text-black border border-slate-300" :
                      "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}>
                      {r.tier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-700">{r.matchesOfficiated}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-emerald-800 font-bold">{r.completedMatches}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-700">{r.disputesHandled}</td>
                  <td className="py-3.5 px-4 text-right font-black text-amber-800 font-mono text-sm flex items-center justify-end space-x-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 inline" />
                    <span>{r.rating.toFixed(2)} / 5.0</span>
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
