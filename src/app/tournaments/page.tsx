"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Calendar, Users, ArrowRight, CheckCircle2, GitFork, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { FitImage } from "@/components/ui/FitImage";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTournaments() {
      try {
        const res = await fetch("/api/tournaments");
        const json = await res.json();
        if (json.success) {
          setTournaments(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTournaments();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-widest mb-1.5">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>Official Championships Circuit</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
            National <span className="text-slate-500">eFootball Tournaments</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Tier-1 esports tournaments, grassroots community cups, double-elimination dynamic brackets, and cash prize pools.
          </p>
        </div>
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-600 font-bold animate-pulse text-xs">
          Loading tournament brackets...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tournaments.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
              No tournaments announced yet. Check back soon.
            </div>
          )}
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="rounded-3xl bg-white border border-slate-200 hover:border-black hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group shadow-sm"
            >
              <div>
                {/* Banner image */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <FitImage src={t.banner} alt={t.name} imgClassName="group-hover:scale-[1.03] transition-transform duration-500" />
                  <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold uppercase">
                    {t.gameCategory}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                    {t.prizePool}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-black group-hover:underline transition-colors line-clamp-1">
                      {t.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>Matches: {t.completedMatches} / {t.totalMatches}</span>
                      <span className="text-black font-bold">{t.progressPercent}% Complete</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-black"
                        style={{ width: `${t.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Dates & Status */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                    <div className="flex items-center space-x-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-black" />
                      <span>{t.startDate ? formatDate(t.startDate) : "TBA"}</span>
                    </div>
                    <div className="flex items-center justify-end space-x-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === "ONGOING" || t.status === "REGISTRATION_OPEN" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-800 border border-slate-200"
                      }`}>
                        {t.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                <Link
                  href={`/tournaments/${t.slug}`}
                  className="w-full py-3 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs text-center transition-all flex items-center justify-center space-x-2 shadow-sm"
                >
                  <GitFork className="w-4 h-4" />
                  <span>{t.isRegistrationOpen ? `Join · ${t.currentParticipants}/${t.maxParticipants} spots` : "View bracket & details"}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
