import Link from "next/link";
import { AlertTriangle, ShieldAlert, Scale, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DisciplinaryPage() {
  const records = await db.getDisciplinaryRecords();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Fair Play Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
          Public <span className="text-slate-500">Disciplinary Register</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl">
          Official transparency log of warnings, match bans, and competitive suspensions issued by the Disciplinary Committee.
        </p>
      </div>

      {/* Disciplinary Table */}
      <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="py-4 px-5">Target</th>
              <th className="py-4 px-5">Category</th>
              <th className="py-4 px-5">Reason / Infraction</th>
              <th className="py-4 px-5">Penalty Sanction</th>
              <th className="py-4 px-5">Issued By</th>
              <th className="py-4 px-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {records.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="py-4 px-5 font-bold text-slate-950">
                  {r.targetName}
                  <div className="text-[10px] text-slate-500 font-mono">ID: {r.targetId}</div>
                </td>
                <td className="py-4 px-5 font-mono text-slate-900 font-semibold">{r.targetType}</td>
                <td className="py-4 px-5 max-w-xs text-slate-600">{r.reason}</td>
                <td className="py-4 px-5">
                  <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold font-mono">
                    {r.penalty}
                  </span>
                </td>
                <td className="py-4 px-5 text-slate-600">{r.issuedBy}</td>
                <td className="py-4 px-5 text-right font-black text-rose-600">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
