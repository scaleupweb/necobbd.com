"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Swords, Play, Clock, CheckCircle, Search, Filter, Shield, Calendar } from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";

const TABS = [
  { id: "ALL", label: "All Matches" },
  { id: "LIVE", label: "Live Now" },
  { id: "UPCOMING", label: "Upcoming" },
  { id: "FINISHED", label: "Finished" },
  { id: "ON_STREAM", label: "On Stream" },
];

export default function MatchCentrePage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTournament, setSelectedTournament] = useState("ALL");

  useEffect(() => {
    async function loadFixtures() {
      try {
        const res = await fetch("/api/fixtures");
        const json = await res.json();
        if (json.success) {
          setFixtures(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFixtures();
  }, []);

  const filtered = fixtures.filter((f) => {
    if (activeTab === "LIVE" && f.status !== "LIVE") return false;
    if (activeTab === "UPCOMING" && f.status !== "SCHEDULED") return false;
    if (activeTab === "FINISHED" && f.status !== "FINISHED") return false;
    if (activeTab === "ON_STREAM" && !f.isOnStream) return false;

    if (selectedTournament !== "ALL" && f.tournamentId !== selectedTournament) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchHome = f.homePlayer?.fullName?.toLowerCase().includes(q) || f.homeClub?.name?.toLowerCase().includes(q);
      const matchAway = f.awayPlayer?.fullName?.toLowerCase().includes(q) || f.awayClub?.name?.toLowerCase().includes(q);
      const matchTourn = f.tournamentName?.toLowerCase().includes(q);
      if (!matchHome && !matchAway && !matchTourn) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
            <Swords className="w-4 h-4 text-black" />
            <span>Matches</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
            Official <span className="text-slate-500">Match Centre</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Upcoming fixtures, live scores and approved results from official tournaments.
          </p>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        {/* Status Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-black text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Tournament filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player, club, round..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-black placeholder-slate-400 focus:outline-none focus:border-black h-10"
            />
          </div>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-black focus:outline-none focus:border-black font-medium h-10"
          >
            <option value="ALL">All Tournaments</option>
            <option value="tourn-1">National Championship 2026</option>
            <option value="tourn-2">Premier Super League S4</option>
            <option value="tourn-3">Dhaka Champions Cup 2026</option>
          </select>
        </div>
      </div>

      {/* Match Cards List */}
      {loading ? (
        <div className="text-center py-20 text-slate-600 animate-pulse font-semibold text-xs">
          Loading matchday scoreboards...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 p-8 rounded-2xl bg-white border border-slate-200 text-slate-500 space-y-2">
          <Swords className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-base font-bold text-black">No matches found</div>
          <div className="text-xs text-slate-500">Try selecting a different filter tab or search query.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 sm:space-y-5 group ${
                m.status === "LIVE"
                  ? "bg-white border-rose-300 shadow-md ring-1 ring-rose-200"
                  : "bg-white border-slate-200 hover:border-black hover:shadow-md"
              }`}
            >
              {/* Header Info */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                <div className="min-w-0 pr-2">
                  <span className="font-black text-[#111111]">{m.tournamentName}</span>
                  <span className="text-slate-500 ml-2 font-mono text-[11px]">• {m.round}</span>
                </div>

                {m.status === "LIVE" ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono font-bold text-[10px] animate-pulse flex items-center space-x-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                    <span>LIVE NOW</span>
                  </span>
                ) : m.status === "FINISHED" ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] shrink-0">
                    FULL TIME
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px] font-bold shrink-0">
                    SCHEDULED
                  </span>
                )}
              </div>

              {/* Scoreboard Body: Perfectly Aligned 3-Column Layout */}
              <div className="py-2 flex items-center justify-between gap-2 sm:gap-4">
                {/* Home Player / Club */}
                <div className="flex-1 flex items-center space-x-2.5 min-w-0">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 p-0.5 shrink-0 shadow-xs">
                    <img
                      src={m.homePlayer?.avatar || m.homeClub?.logo || "/images/placeholders/club.svg"}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-black text-[#111111] group-hover:underline transition-colors truncate">
                      {m.homePlayer?.fullName || m.homeClub?.name}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {m.homeClub?.shortName || "Unattached"} {m.homePlayer?.rating ? `• ${m.homePlayer.rating} OVR` : ""}
                    </div>
                  </div>
                </div>

                {/* Central Scorebox: Never Wraps & Perfectly Centered */}
                <div className="shrink-0 flex flex-col items-center justify-center px-1 sm:px-2">
                  {m.status === "FINISHED" || m.status === "LIVE" ? (
                    <div className="h-10 px-3.5 sm:px-4 rounded-xl bg-[#111111] text-white flex items-center justify-center space-x-2 font-heading font-extrabold text-base sm:text-lg tabular-nums shadow-sm select-none min-w-[76px]">
                      <span className="w-4 text-center leading-none">{m.result?.homeScore ?? 0}</span>
                      <span className="text-slate-400 font-normal text-sm leading-none">-</span>
                      <span className="w-4 text-center leading-none">{m.result?.awayScore ?? 0}</span>
                    </div>
                  ) : (
                    <div className="h-9 px-4 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 min-w-[56px]">
                      VS
                    </div>
                  )}
                  <div className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 mt-1 whitespace-nowrap">
                    {m.status === "LIVE" ? "75' Live" : formatTime(m.scheduledDate)}
                  </div>
                </div>

                {/* Away Player / Club */}
                <div className="flex-1 flex items-center justify-end space-x-2.5 min-w-0 text-right">
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-black text-[#111111] group-hover:underline transition-colors truncate">
                      {m.awayPlayer?.fullName || m.awayClub?.name}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {m.awayClub?.shortName || "Unattached"} {m.awayPlayer?.rating ? `• ${m.awayPlayer.rating} OVR` : ""}
                    </div>
                  </div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 p-0.5 shrink-0 shadow-xs">
                    <img
                      src={m.awayPlayer?.avatar || m.awayClub?.logo || "/images/placeholders/club.svg"}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* MOTM / Referee Bar */}
              {m.result?.motmPlayerName && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                  <span className="text-amber-900 font-bold flex items-center truncate">
                    ★ MOTM: {m.result.motmPlayerName}
                  </span>
                  <span className="text-amber-800 text-[11px] truncate max-w-[180px] ml-2">{m.result.motmReason}</span>
                </div>
              )}

              {/* Bottom Footer Actions */}
              <div className="flex flex-col xs:flex-row xs:items-center justify-between pt-3 border-t border-slate-100 text-xs gap-2.5">
                <div className="flex items-center space-x-2 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>{formatDate(m.scheduledDate)}</span>
                  {m.referee && <span className="truncate">• Ref: {m.referee.name}</span>}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {m.isOnStream && (
                    <Link
                      href={`/matches/${m.id}`}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 transition-colors flex items-center space-x-1 min-h-[36px]"
                    >
                      <Play className="w-3 h-3 fill-rose-600" />
                      <span>Watch Stream</span>
                    </Link>
                  )}
                  <Link
                    href={`/matches/${m.id}`}
                    className="px-4 py-1.5 rounded-lg bg-black text-white font-bold hover:bg-zinc-800 transition-colors shadow-sm min-h-[36px] flex items-center justify-center"
                  >
                    Match Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
