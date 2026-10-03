"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Target,
  Zap,
  Shield,
  Award,
  Scale,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { getFormColor, formatCurrency } from "@/lib/utils";
import { noClubLabel } from "@/lib/squad";

const RANKING_TABS = [
  { id: "players", label: "Player Elo Rankings", href: "/rankings" },
  { id: "scorers", label: "Top Scorers (Golden Boot)", href: "/rankings/scorers" },
  { id: "assists", label: "Top Playmakers", href: "/rankings/assists" },
  { id: "clean-sheets", label: "Clean Sheets", href: "/rankings/clean-sheets" },
  { id: "motm", label: "MOTM Leaders", href: "/rankings/motm" },
  { id: "referees", label: "Referee Rankings", href: "/rankings/referees" },
];

export default function RankingsPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewType, setViewType] = useState<"players" | "clubs">("players");

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch("/api/rankings?type=players"),
          fetch("/api/rankings?type=clubs"),
        ]);
        const [pJson, cJson] = await pRes.json();
        if (pJson.success) setPlayers(pJson.data);
        if (cJson.success) setClubs(cJson.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredPlayers = players.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      return p.fullName.toLowerCase().includes(q) || p.username.toLowerCase().includes(q) || p.club?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
            <Trophy className="w-4 h-4 text-black" />
            <span>Official Bangladesh Standings</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
            Championship <span className="text-slate-500">Leaderboards</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Live Elo algorithm ratings calculated from official tournament matches, verified win records, and certified referee reports.
          </p>
        </div>
      </div>

      {/* Sub-Ranking Navigation Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {RANKING_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab.id === "players"
                ? "bg-black text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Toggle View & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
          <button
            onClick={() => setViewType("players")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewType === "players" ? "bg-black text-white" : "text-slate-700 hover:text-black"
            }`}
          >
            Athletes (Elo)
          </button>
          <button
            onClick={() => setViewType("clubs")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewType === "clubs" ? "bg-black text-white" : "text-slate-700 hover:text-black"
            }`}
          >
            Clubs (League)
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leaderboard..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-black placeholder-slate-400 focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-600 font-bold animate-pulse text-xs">
          Calculating Elo Rating Standings...
        </div>
      ) : viewType === "players" ? (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Athlete</th>
                <th className="py-3.5 px-4">Club</th>
                <th className="py-3.5 px-4 text-center">Played</th>
                <th className="py-3.5 px-4 text-center">W - D - L</th>
                <th className="py-3.5 px-4 text-center">Win Rate %</th>
                <th className="py-3.5 px-4 text-center">Goals</th>
                <th className="py-3.5 px-4 text-center">Recent Form</th>
                <th className="py-3.5 px-4 text-right">Rating (Elo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPlayers.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                        idx === 0
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : idx === 1
                          ? "bg-slate-200 text-slate-800"
                          : idx === 2
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "text-slate-500"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Link
                      href={`/players/${p.username}`}
                      className="flex items-center space-x-3 group-hover:underline transition-colors"
                    >
                      <img src={p.avatar} alt={p.fullName} className="w-8 h-8 rounded-lg object-cover border border-slate-200 p-0.5" />
                      <div>
                        <div className="font-bold text-black">{p.fullName}</div>
                        <div className="text-[10px] text-slate-500">@{p.username} • {p.preferredPosition}</div>
                      </div>
                    </Link>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {p.club?.name || noClubLabel(p)}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                    {p.stats?.matchesPlayed || 0}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                    {p.stats?.wins || 0} - {p.stats?.draws || 0} - {p.stats?.losses || 0}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                    {p.stats?.winRate || 0}%
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-black">
                    {p.stats?.goalsScored || 0}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {p.form?.map((r: string, fIdx: number) => (
                        <span
                          key={fIdx}
                          className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center border ${getFormColor(
                            r
                          )}`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className="text-sm font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">
                      {p.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Club</th>
                <th className="py-3.5 px-4 text-center">Played</th>
                <th className="py-3.5 px-4 text-center">W - D - L</th>
                <th className="py-3.5 px-4 text-center">Win Rate %</th>
                <th className="py-3.5 px-4 text-center">Squad</th>
                <th className="py-3.5 px-4 text-center">Trophies</th>
                <th className="py-3.5 px-4 text-right">League Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {clubs.map((club, idx) => (
                <tr key={club.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-slate-500">#{idx + 1}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Link href={`/clubs/${club.slug}`} className="flex items-center space-x-3 group-hover:underline">
                      <img src={club.logo} alt={club.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 p-0.5" />
                      <span className="font-bold text-black">{club.name}</span>
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-700">{club.stats?.matches || 16}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                    {club.stats?.wins || 0} - {club.stats?.draws || 0} - {club.stats?.losses || 0}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                    {club.stats?.winRate || 0}%
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600">{club.squadCount}</td>
                  <td className="py-3.5 px-4 text-center text-amber-700 font-bold">{club.trophiesCount}</td>
                  <td className="py-3.5 px-4 text-right font-black text-black font-mono text-sm">{club.points} PTS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
