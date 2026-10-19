"use client";

import { useState, useEffect, Suspense } from "react";
import { isRated } from "@/lib/squad";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, User, Shield, Trophy, Swords, ArrowRight } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any>({ players: [], clubs: [], tournaments: [], matches: [], news: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function doSearch() {
      if (!query.trim()) {
        setResults({ players: [], clubs: [], tournaments: [], matches: [], news: [] });
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) setResults(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    doSearch();
  }, [query]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-3xl font-black text-slate-950">
          Platform Search Results
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Explore registered athletes, esports clubs, championship brackets, and live fixtures.
        </p>

        {/* Search input */}
        <div className="relative max-w-xl mt-4">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Type athlete name, Konami UID, club, tournament..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-600 font-bold animate-pulse">Searching platform database...</div>
      ) : (
        <div className="space-y-8">
          {/* Players */}
          {results.players?.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center">
                <User className="w-4 h-4 mr-2 text-black" /> Athletes ({results.players.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.players.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/players/${p.username}`}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-black shadow-sm hover:shadow-md flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={p.avatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                      <div>
                        <div className="text-sm font-bold text-slate-950 group-hover:text-black">{p.fullName}</div>
                        <div className="text-xs text-slate-500">@{p.username} • {p.preferredPosition}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{isRated(p) ? `${p.rating} ELO` : "New"}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Clubs */}
          {results.clubs?.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center">
                <Shield className="w-4 h-4 mr-2 text-black" /> Clubs ({results.clubs.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.clubs.map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/clubs/${c.slug}`}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-black shadow-sm hover:shadow-md flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={c.logo} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                      <div>
                        <div className="text-sm font-bold text-slate-950 group-hover:text-black">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.location}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{c.points} PTS</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tournaments */}
          {results.tournaments?.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-black" /> Tournaments ({results.tournaments.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.tournaments.map((t: any) => (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.slug}`}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-black shadow-sm hover:shadow-md flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-950 group-hover:text-black">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.prizePool} • {t.status}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-black" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-600 font-bold">Loading Search Desk...</div>}>
      <SearchContent />
    </Suspense>
  );
}
