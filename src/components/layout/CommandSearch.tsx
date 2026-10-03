"use client";

import { useState, useEffect } from "react";
import { Search, X, User, Shield, Trophy, Swords, Newspaper, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { noClubLabel } from "@/lib/squad";

export function CommandSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    players: any[];
    clubs: any[];
    tournaments: any[];
    matches: any[];
    news: any[];
  }>({ players: [], clubs: [], tournaments: [], matches: [], news: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ players: [], clubs: [], tournaments: [], matches: [], news: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-slate-700 mr-3" />
          <input
            type="text"
            placeholder="Search athletes, clubs, tournaments, matches, news... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-black placeholder-slate-400 outline-none text-sm font-medium"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-black p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 px-2 py-1 text-[11px] bg-slate-200 text-slate-700 rounded border border-slate-300 hover:bg-slate-300 font-mono"
          >
            ESC
          </button>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="text-center py-8 text-slate-600 text-xs animate-pulse font-medium">
              Searching database...
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-8 text-slate-500 text-xs">
              Type to search players by name, Konami UID, clubs, tournaments or matchday fixtures.
            </div>
          )}

          {!loading &&
            query &&
            !results.players.length &&
            !results.clubs.length &&
            !results.tournaments.length &&
            !results.matches.length &&
            !results.news.length && (
              <div className="text-center py-8 text-slate-500 text-xs">
                No matching results found for &quot;{query}&quot;.
              </div>
            )}

          {/* Players */}
          {results.players.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <User className="w-3 h-3 mr-1 text-black" /> Athletes ({results.players.length})
              </div>
              <div className="space-y-1">
                {results.players.map((p) => (
                  <Link
                    key={p.id}
                    href={`/players/${p.username}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-black">
                        {p.fullName?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-black group-hover:underline">
                          {p.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          @{p.username} • {p.club?.name || noClubLabel(p)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                        {p.rating} ELO
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-black" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Clubs */}
          {results.clubs.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Shield className="w-3 h-3 mr-1 text-black" /> Clubs ({results.clubs.length})
              </div>
              <div className="space-y-1">
                {results.clubs.map((c) => (
                  <Link
                    key={c.id}
                    href={`/clubs/${c.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-black">
                        {c.shortName?.substring(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-black group-hover:underline">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{c.location}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-black" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tournaments */}
          {results.tournaments.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Trophy className="w-3 h-3 mr-1 text-black" /> Tournaments ({results.tournaments.length})
              </div>
              <div className="space-y-1">
                {results.tournaments.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-bold text-black group-hover:underline">{t.name}</div>
                      <div className="text-[10px] text-slate-500">Prize Pool: {t.prizePool}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-black" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Matches */}
          {results.matches.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <Swords className="w-3 h-3 mr-1 text-black" /> Fixtures & Matches ({results.matches.length})
              </div>
              <div className="space-y-1">
                {results.matches.map((m) => (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-bold text-black group-hover:underline">
                        {m.homePlayer?.fullName || m.homeClub?.shortName} vs{" "}
                        {m.awayPlayer?.fullName || m.awayClub?.shortName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {m.tournamentName} • {m.round}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {m.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
