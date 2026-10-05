import Link from "next/link";
import { Shield, Users, Trophy, Award, Globe, HeartHandshake } from "lucide-react";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [leadership, settings] = await Promise.all([db.getLeadership(), getSiteSettings()]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold uppercase">
          <Globe className="w-3.5 h-3.5" />
          <span>About {settings.brand.siteName}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">{settings.pages.aboutTitle}</h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">{settings.pages.aboutIntro}</p>
      </div>

      {/* Mission & Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-950">Fair Results</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every official result is checked by the admin team before it counts. Player and club ratings update automatically after each approved match.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-950">Clubs & Transfers</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Clubs build a 30-player Main Team Squad. Signings go through the Transfer Window with a 120-day contract and admin approval, and every move is kept in the player's history.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-950">Player Profiles</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every player gets a public profile with their Konami ID, device, club, contract, transfer history and match record.
          </p>
        </div>
      </div>

      {/* Leadership Team Section */}
      {leadership.length > 0 && (
      <div className="space-y-6 pt-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950">Founders & Executive Council</h2>
          <p className="text-xs text-slate-500">The people who run {settings.brand.siteName.trim()}.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {leadership.map((lead: any) => (
            <div
              key={lead.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-black shadow-sm hover:shadow-md transition-all text-center space-y-4 group"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 mx-auto">
                <img src={lead.photo} alt={lead.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-950 group-hover:text-black transition-colors">
                  {lead.name}
                </h4>
                <div className="text-xs text-slate-700 font-semibold">{lead.role}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{lead.period}</div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {lead.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
