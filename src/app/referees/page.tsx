import Link from "next/link";
import { Scale, Star, ShieldCheck, Award, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RefereesPage() {
  const referees = await db.getReferees();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
          <Scale className="w-4 h-4 text-black" />
          <span>Governance & Match Integrity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
          Match <span className="text-slate-500">Match Officials</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl">
          The officials who check match proof and approve results in official tournaments.
        </p>
      </div>

      {referees.length === 0 && <EmptyState icon={Scale} title="No match officials yet" text="Officials will be listed here once the admin team adds them." />}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {referees.map((ref: any) => (
          <div
            key={ref.id}
            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-black shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{ref.officialId}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  ref.tier === "TIER_1" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                  ref.tier === "TIER_2" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                  "bg-slate-100 text-slate-700 border border-slate-200"
                }`}>
                  {ref.tier}
                </span>
              </div>

              <div className="flex items-center space-x-4 my-3">
                <img src={ref.avatar} alt={ref.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200" />
                <div>
                  <h3 className="text-base font-bold text-slate-950 group-hover:text-black transition-colors">
                    {ref.name}
                  </h3>
                  <div className="text-xs text-slate-500">{ref.role}</div>
                  <div className="flex items-center space-x-1 text-xs text-amber-600 font-bold mt-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{ref.rating.toFixed(2)} Rating</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Matches</div>
                <div className="font-bold text-slate-950 font-mono">{ref.matchesOfficiated}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Reports</div>
                <div className="font-bold text-emerald-700 font-mono">{ref.completedMatches}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Disputes</div>
                <div className="font-bold text-slate-900 font-mono">{ref.disputesHandled}</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Official since {formatDate(ref.joinedDate)}</span>
              <span className="text-emerald-700 font-bold">Active Ref</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
