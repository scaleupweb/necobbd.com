"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Swords,
  Award,
  ArrowRightLeft,
  Trophy,
  AlertTriangle,
  ArrowRight,
  User,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const CATEGORIES = ["All", "Matches", "Awards", "Transfers", "Tournaments", "Players"];

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("All");

  useEffect(() => {
    async function loadActivity() {
      try {
        const res = await fetch(`/api/activity${selectedCat !== "All" ? `?category=${selectedCat}` : ""}`);
        const json = await res.json();
        if (json.success) setActivities(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, [selectedCat]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "MATCH_WIN":
        return <Swords className="w-5 h-5 text-slate-950" />;
      case "MOTM_AWARD":
        return <Award className="w-5 h-5 text-amber-600" />;
      case "TRANSFER":
        return <ArrowRightLeft className="w-5 h-5 text-emerald-600" />;
      case "TOURNAMENT_START":
        return <Trophy className="w-5 h-5 text-purple-600" />;
      case "DISCIPLINARY":
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      default:
        return <Activity className="w-5 h-5 text-slate-900" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <div className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
          <Activity className="w-4 h-4 text-black" />
          <span>Real-Time Pulse</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
          What's Happening <span className="text-slate-500">Activity Stream</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl">
          Live stream of match victories, MOTM honors, transfers, tournament progression, and community milestones.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCat === cat
                ? "bg-black text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 hover:text-black border border-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Loading live activity feed...</div>
      ) : (
        <div className="space-y-4">
          {activities.map((evt) => (
            <div
              key={evt.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-black shadow-sm hover:shadow-md transition-all flex items-start space-x-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                {getEventIcon(evt.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    {evt.category}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {formatRelativeTime(evt.createdAt)}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-950 group-hover:text-black transition-colors">
                  {evt.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {evt.description}
                </p>
                {evt.targetUrl && (
                  <Link
                    href={evt.targetUrl}
                    className="inline-flex items-center text-xs font-bold text-slate-900 hover:underline mt-2 space-x-1"
                  >
                    <span>View Match / Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
