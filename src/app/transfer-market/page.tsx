"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  User,
} from "lucide-react";
import { formatCurrency, getFormColor } from "@/lib/utils";

export default function TransferMarketPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [offeredFee, setOfferedFee] = useState(50);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [me, setMe] = useState<any>(null);
  // "me" holds the club this user manages (from /api/me/club), if any.
  const canBid = !!me && me.isManager && me.status === "ACTIVE";

  useEffect(() => {
    async function loadTransfers() {
      try {
        const res = await fetch("/api/transfers");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTransfers();
    fetch("/api/me/club").then((r) => r.json()).then((j) => j.success && setMe(j.data)).catch(() => {});
  }, []);

  const handleSendTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferError("");
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          targetClubId: me?.id,
          offeredFee: Number(offeredFee),
          message,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setOfferError(json.error?.message || "Offer failed");
        return;
      }
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setRequestModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const listings = data?.listings || [];

  const filtered = listings.filter((item: any) => {
    const p = item.player;
    if (!p) return false;
    if (filterType === "FREE_AGENT" && p.contract?.status !== "FREE_AGENT") return false;
    if (filterType === "LISTED" && p.contract?.status !== "TRANSFER_LISTED" && item.status !== "LISTED") return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.konamiId.toLowerCase().includes(q) ||
        p.club?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase mb-2">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{data?.windowStatus?.name || "Transfer Market"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Transfer Market & <span className="text-slate-500">Valuation Hub</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              Virtual player market values, contract countdowns, free agent signings, and official club transfers.
            </p>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <Clock className="w-8 h-8 text-emerald-600" />
            <div>
              <div className="text-slate-500 font-bold uppercase text-[10px]">Window Status</div>
              <div className="text-sm font-black text-emerald-600">OPEN</div>
              <div className="text-[10px] text-slate-500">{listings.length} player(s) listed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "ALL" ? "bg-black text-white shadow-sm" : "text-slate-600 hover:text-black"
            }`}
          >
            All Market Listings
          </button>
          <button
            onClick={() => setFilterType("FREE_AGENT")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "FREE_AGENT" ? "bg-black text-white shadow-sm" : "text-slate-600 hover:text-black"
            }`}
          >
            Free Agents
          </button>
          <button
            onClick={() => setFilterType("LISTED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "LISTED" ? "bg-black text-white shadow-sm" : "text-slate-600 hover:text-black"
            }`}
          >
            Transfer Listed
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transfer target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black shadow-sm"
          />
        </div>
      </div>

      {/* Transfer Listings Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-600 font-bold animate-pulse">Loading market listings...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">No players on the transfer list right now.</div>
          )}
          {filtered.map((item: any) => {
            const p = item.player;
            if (!p) return null;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white border border-slate-200 hover:border-black p-6 flex flex-col justify-between space-y-5 transition-all group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        p.contract?.status === "FREE_AGENT"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {p.contract?.status === "FREE_AGENT" ? "FREE AGENT" : "TRANSFER LISTED"}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{p.rating} ELO</span>
                  </div>

                  <div className="flex items-center space-x-3.5 my-3">
                    <img
                      src={p.avatar}
                      alt={p.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div>
                      <Link
                        href={`/players/${p.username}`}
                        className="text-base font-bold text-slate-900 group-hover:text-black transition-colors"
                      >
                        {p.fullName}
                      </Link>
                      <div className="text-xs text-slate-500">@{p.username} • {p.preferredPosition}</div>
                      <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                        {p.club?.name || "Unattached Free Agent"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Virtual Market Value:</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      {formatCurrency(p.marketValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Contract Duration:</span>
                    <span className="font-mono text-slate-800">
                      {p.contract?.status === "FREE_AGENT" ? "Free Agent" : `${p.contract?.daysRemaining || 0}d remaining`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {canBid ? (
                    <button
                      onClick={() => {
                        setSelectedPlayer(p);
                        setOfferError("");
                        setRequestModalOpen(true);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 shadow-sm transition-all text-center"
                    >
                      Make an offer
                    </button>
                  ) : (
                    <span className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-[11px] text-center">
                      Club managers can bid
                    </span>
                  )}
                  <Link
                    href={`/players/${p.username}`}
                    className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-black hover:bg-slate-200 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transfer History Table */}
      <div className="pt-8 space-y-4">
        <h3 className="text-base font-black text-slate-950 uppercase tracking-wider">
          Completed Transfer Logs & History
        </h3>
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-4">Athlete</th>
                <th className="py-3 px-4">Previous Club</th>
                <th className="py-3 px-4">New Club</th>
                <th className="py-3 px-4 text-center">Fee ($M)</th>
                <th className="py-3 px-4 text-right">Approved Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data?.history?.map((h: any) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-950">{h.playerName}</td>
                  <td className="py-3 px-4 text-slate-600">{h.previousClubName}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">{h.newClubName}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{formatCurrency(h.fee)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">{h.transferDate ? h.transferDate.split("T")[0] : "2026-09-17"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Modal */}
      {requestModalOpen && selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-950">
                Submit Transfer Request
              </h3>
              <button onClick={() => setRequestModalOpen(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>

            {submitted ? (
              <div className="py-8 text-center text-emerald-600 font-bold space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
                <div>Offer sent! An admin will review it.</div>
              </div>
            ) : (
              <form onSubmit={handleSendTransfer} className="space-y-4 text-xs">
                {offerError && <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{offerError}</div>}
                <div>
                  <label className="block text-slate-500 mb-1">Target Athlete</label>
                  <div className="font-bold text-slate-950 text-sm">{selectedPlayer.fullName} (@{selectedPlayer.username})</div>
                  <div className="text-[11px] text-slate-500">Current Valuation: {formatCurrency(selectedPlayer.marketValue)}</div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Offered Transfer Fee ($M)</label>
                  <input
                    type="number"
                    min="0"
                    value={offeredFee}
                    onChange={(e) => setOfferedFee(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 font-mono font-bold text-base focus:outline-none focus:border-black focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Message / Contract Proposal</label>
                  <textarea
                    rows={3}
                    placeholder="Provide contract duration and role in starting lineup..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 focus:outline-none focus:border-black focus:bg-white"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 shadow-sm"
                  >
                    Send Official Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
