import Link from "next/link";
import { GraduationCap, ExternalLink, Globe } from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const partners = await db.getPartners();
  const sponsors = await db.getSponsors();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 text-center space-y-2">
        <div className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
          <GraduationCap className="w-4 h-4 text-black" />
          <span>Institutional & Commercial Alliance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
          University Esports & <span className="text-slate-500">Partner Network</span>
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Collaborating with premier universities, collegiate guilds, technology brands, and media partners across the nation.
        </p>
      </div>

      {/* Collegiate Partners Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-950 uppercase tracking-wider">Collegiate & Community Partners</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partners.map((p: any) => (
            <div
              key={p.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-black shadow-sm hover:shadow-md p-6 flex flex-col justify-between space-y-4 group transition-all"
            >
              <div className="flex items-center space-x-4">
                <img src={p.logo} alt={p.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200" />
                <div>
                  <h3 className="text-sm font-bold text-slate-950 group-hover:text-black transition-colors">{p.name}</h3>
                  <div className="text-xs text-slate-500">{p.category}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
              {p.website && (
                <a
                  href={p.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-900 hover:underline pt-2 border-t border-slate-100"
                >
                  <span>Visit Organization Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sponsors Grid */}
      <div className="space-y-4 pt-4">
        <h2 className="text-base font-bold text-slate-950 uppercase tracking-wider">Official Tournament Sponsors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sponsors.map((s: any) => (
            <div
              key={s.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-black shadow-sm hover:shadow-md flex items-center space-x-4 group transition-all"
            >
              <img src={s.logo} alt={s.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200" />
              <div>
                <h3 className="text-sm font-bold text-slate-950 group-hover:text-black">{s.name}</h3>
                <div className="text-xs text-slate-500">Official {s.placement} Partner</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
