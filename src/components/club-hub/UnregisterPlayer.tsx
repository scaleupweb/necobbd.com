"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, UserMinus, Loader2, AlertTriangle, Crown, Snowflake, CheckCircle2 } from "lucide-react";
import { toast } from "@/lib/feedback";
import { formatDate } from "@/lib/utils";
import { CONTRACT_DAYS, contractDaysLeft, isFrozen, freezeLeft } from "@/lib/squad";
import { useClubHub } from "./ClubHubContext";

export function UnregisterPlayer() {
  const { club, reload } = useClubHub();
  const squad = [...(club.squad || [])].sort((a: any, b: any) => a.fullName.localeCompare(b.fullName));
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const siteName: string = (club.siteName || "NECOB").trim();

  const blockReason = (p: any) =>
    p.userId && p.userId === club.managerId ? "Main manager" : isFrozen(p.frozenUntil) ? `Frozen · ${freezeLeft(p.frozenUntil)}` : "";

  const s = q.trim().toLowerCase();
  const shown = squad.filter((p: any) => !s || `${p.fullName} ${p.username} ${p.konamiId}`.toLowerCase().includes(s));
  const selected = squad.find((p: any) => p.id === selectedId);
  const matches = typed.trim() === siteName;

  const pick = (id: string) => {
    setSelectedId(id);
    setTyped("");
    setTimeout(() => document.getElementById("unregister-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const submit = async () => {
    if (!selected || !matches) return;
    setBusy(true);
    try {
      const res = await fetch("/api/me/club/unregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: selected.id, confirmText: typed }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Could not unregister the player");
      toast.success(`${selected.fullName} was unregistered from ${club.name}`);
      setSelectedId("");
      setTyped("");
      await reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!squad.length) return <div className="rounded-3xl bg-white border border-slate-200 py-12 text-center text-sm text-slate-500">No players in your squad.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-4 items-start">
      {/* Squad list */}
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
        <div className="p-3 border-b border-slate-100">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 pb-2">Main Team Squad · {squad.length}</div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, username or UID…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-black focus:bg-white"
            />
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
          {shown.map((p: any) => {
            const block = blockReason(p);
            return (
              <button
                key={p.id}
                disabled={!!block}
                onClick={() => pick(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  block ? "opacity-50 cursor-not-allowed" : p.id === selectedId ? "bg-rose-50" : "hover:bg-slate-50"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.avatar} alt="" className={`w-10 h-10 rounded-full object-cover bg-slate-100 ring-2 ${p.id === selectedId ? "ring-rose-400" : "ring-transparent"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-950 truncate">{p.fullName}</span>
                  <span className="block text-[11px] text-slate-500 font-mono truncate">{p.konamiId || `@${p.username}`}</span>
                </span>
                {block ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-500">
                    {block === "Main manager" ? <Crown className="w-3 h-3" /> : <Snowflake className="w-3 h-3" />} {block}
                  </span>
                ) : (
                  <span className="text-[11px] font-black font-mono text-slate-400">{p.shirtNo ? `#${p.shirtNo}` : ""}</span>
                )}
              </button>
            );
          })}
          {!shown.length && <div className="p-6 text-center text-xs text-slate-500">No player matches “{q}”.</div>}
        </div>
      </div>

      {/* Confirm panel */}
      <div id="unregister-panel" className="scroll-mt-24">
        {selected ? (
          <div className="rounded-3xl bg-white border border-rose-200 p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.avatar} alt="" className="w-14 h-14 rounded-full object-cover bg-slate-100" />
              <div className="min-w-0 flex-1">
                <div className="text-base font-black text-slate-950 truncate">{selected.fullName}</div>
                <div className="text-xs text-slate-500 font-mono">
                  @{selected.username} · {selected.preferredPosition}
                </div>
              </div>
              <Link href={`/players/${selected.username}`} target="_blank" className="text-xs font-bold text-slate-500 hover:text-black shrink-0">
                Profile ↗
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                ["Konami UID", selected.konamiId || "—"],
                ["Shirt", selected.shirtNo ? `#${selected.shirtNo}` : "—"],
                ["Seat", selected.seat || "—"],
                ["Contract", selected.contract?.endDate ? `${contractDaysLeft(selected.contract.endDate)}/${CONTRACT_DAYS}d · ${formatDate(selected.contract.endDate)}` : "—"],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{k}</div>
                  <div className="font-bold text-slate-900 truncate">{v}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-900">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <b>{selected.fullName}</b> will leave <b>{club.name}</b> and have no club. Their seat and shirt number are freed, their contract ends, and any club access they had is removed. This is recorded in the transfer history.
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700">
                Type <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono">{siteName}</span> to confirm
              </span>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                placeholder={siteName}
                autoComplete="off"
                spellCheck={false}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono focus:outline-none bg-white ${
                  typed ? (matches ? "border-emerald-400 focus:border-emerald-500" : "border-rose-300 focus:border-rose-400") : "border-slate-200 focus:border-black"
                }`}
              />
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${matches ? "text-emerald-700" : "text-slate-400"}`}>
                {matches ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                {matches ? "Confirmed" : "Must match exactly, including capital letters."}
              </span>
            </label>

            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedId("")} className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-bold">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!matches || busy}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />} Unregister player
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-slate-200 text-center py-16 px-6">
            <UserMinus className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">Select a player to unregister</p>
            <p className="text-xs text-slate-500">The main manager and players frozen after joining can&apos;t be unregistered.</p>
          </div>
        )}
      </div>
    </div>
  );
}
