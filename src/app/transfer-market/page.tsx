"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  ArrowRight,
  Search,
  Facebook,
  UserPlus,
  Hourglass,
  Tag,
  Unlock,
  Shield,
  CalendarClock,
  Flame,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { CONTRACT_DAYS, contractDaysLeft, isFreeAgent, ratingText } from "@/lib/squad";
import { toast, promptDialog } from "@/lib/feedback";

type Tab = "moves" | "available" | "ending" | "listed";

const TYPE: Record<string, { label: string; tone: string }> = {
  free: { label: "Joined", tone: "bg-emerald-50 text-emerald-700" },
  signing: { label: "Signed", tone: "bg-emerald-50 text-emerald-700" },
  transfer: { label: "Club to club", tone: "bg-indigo-50 text-indigo-700" },
  released: { label: "Left club", tone: "bg-slate-100 text-slate-600" },
  expired: { label: "Contract ended", tone: "bg-amber-50 text-amber-800" },
};

const PAGE = 24;

export default function TransferMarketPage() {
  const [data, setData] = useState<any>(null);
  const [players, setPlayers] = useState<any[] | null>(null);
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("moves");

  useEffect(() => {
    fetch("/api/transfers", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j.success ? j.data : { feed: [], listings: [] }))
      .catch(() => setData({ feed: [], listings: [] }));
    fetch("/api/players?sortBy=rating", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setPlayers(j.success ? j.data : []))
      .catch(() => setPlayers([]));
    fetch("/api/me/club")
      .then((r) => r.json())
      .then((j) => j.success && setMe(j.data))
      .catch(() => {});
  }, []);

  const feed: any[] = data?.feed || [];
  const listings: any[] = data?.listings || [];
  const all = players || [];

  const stats = useMemo(() => {
    const month = Date.now() - 30 * 86400000;
    const ending = all.filter((p) => p.club && contractDaysLeft(p.contract?.endDate) > 0 && contractDaysLeft(p.contract?.endDate) <= 30);
    const nextEnd = all
      .filter((p) => p.club && p.contract?.endDate && new Date(p.contract.endDate).getTime() > Date.now())
      .map((p) => new Date(p.contract.endDate).getTime())
      .sort((a, b) => a - b)[0];
    return {
      moves: feed.length,
      lastMonth: feed.filter((m) => new Date(m.date).getTime() > month && (m.type === "free" || m.type === "signing" || m.type === "transfer")).length,
      available: all.filter((p) => !p.club).length,
      freeAgents: all.filter((p) => isFreeAgent(p)).length,
      ending: ending.length,
      nextEnd: nextEnd ? new Date(nextEnd).toISOString() : null,
    };
  }, [feed, all]);

  const loading = !data || players === null;

  const tabs: [Tab, string, any, number][] = [
    ["moves", "Latest moves", ArrowRightLeft, stats.moves],
    ["available", "Available players", Unlock, stats.available],
    ["ending", "Contracts ending", Hourglass, stats.ending],
    ...(listings.length ? ([["listed", "Transfer list", Tag, listings.length]] as [Tab, string, any, number][]) : []),
  ];

  return (
    <div className="bg-[#F6F7F9] -mb-px">
      {/* ================= Header ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#0B0C0F] text-white p-6 sm:p-10">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(199,154,59,0.3),transparent_50%),radial-gradient(ellipse_at_0%_100%,rgba(99,102,241,0.2),transparent_45%)]" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
            style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
          <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#C79A3B]">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer market
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${data?.windowStatus?.isOpen === false ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${data?.windowStatus?.isOpen === false ? "bg-rose-400" : "bg-emerald-400 animate-pulse"}`} />
                  Window {data?.windowStatus?.isOpen === false ? "closed" : "open"}
                </span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight">
                Every move, <span className="bg-gradient-to-r from-[#F3D48A] to-[#C79A3B] bg-clip-text text-transparent">every signing</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/60 max-w-xl">
                Club signings and transfers across NECOB, players free to sign, and {CONTRACT_DAYS}-day contracts about to run out.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <Stat icon={ArrowRightLeft} label="Total moves" value={loading ? null : stats.moves} />
              <Stat icon={Flame} label="Signed · 30 days" value={loading ? null : stats.lastMonth} />
              <Stat icon={Unlock} label="Available" value={loading ? null : stats.available} />
              <Stat icon={Hourglass} label="Ending ≤30d" value={loading ? null : stats.ending} />
            </div>
          </div>
        </div>
      </section>

      {/* ================= Tabs ================= */}
      <div className="md:sticky md:top-16 z-20 mt-4 bg-[#F6F7F9]/90 backdrop-blur border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map(([id, label, Icon, n]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                tab === id ? "bg-black text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${tab === id ? "bg-white/15" : "bg-slate-100"}`}>{n}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="py-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
        ) : tab === "moves" ? (
          <Moves feed={feed} />
        ) : tab === "available" ? (
          <Available players={all} />
        ) : tab === "ending" ? (
          <Ending players={all} nextEnd={stats.nextEnd} />
        ) : (
          <Listed listings={listings} me={me} />
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number | null }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 min-w-[110px]">
      <Icon className="w-4 h-4 text-[#C79A3B]" />
      <div className="mt-1.5 text-xl sm:text-2xl font-black font-mono">{value ?? "–"}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</div>
    </div>
  );
}

function ClubMark({ c, dim = false }: { c: any; dim?: boolean }) {
  if (c?.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={c.logo} alt="" className={`w-11 h-11 rounded-xl object-cover bg-white ring-1 ring-slate-200 ${dim ? "grayscale opacity-60" : ""}`} />;
  }
  return (
    <span className="w-11 h-11 rounded-xl bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center">
      <Shield className="w-5 h-5 text-slate-300" />
    </span>
  );
}

const clubName = (c: any) =>
  c?.slug ? (
    <Link href={`/clubs/${c.slug}`} className="hover:underline">
      {c.name}
    </Link>
  ) : (
    c?.name || "No club"
  );

// ------------------------------------------------------------- Latest moves

function Moves({ feed }: { feed: any[] }) {
  const [type, setType] = useState("all");
  const [club, setClub] = useState("");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);

  const clubs = useMemo(() => {
    const m = new Map<string, any>();
    for (const x of feed) for (const c of [x.from, x.to]) if (c?.slug) m.set(c.slug, c);
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [feed]);

  const busiest = useMemo(() => {
    const m = new Map<string, { club: any; n: number }>();
    for (const x of feed) if (x.to?.slug && x.type !== "released" && x.type !== "expired") m.set(x.to.slug, { club: x.to, n: (m.get(x.to.slug)?.n || 0) + 1 });
    return [...m.values()].sort((a, b) => b.n - a.n).slice(0, 8);
  }, [feed]);

  const s = q.trim().toLowerCase();
  const list = useMemo(
    () =>
      feed.filter((m) => {
        if (type === "join" && !(m.type === "free" || m.type === "signing")) return false;
        if (type === "transfer" && m.type !== "transfer") return false;
        if (type === "out" && !(m.type === "released" || m.type === "expired")) return false;
        if (club && m.from?.slug !== club && m.to?.slug !== club) return false;
        return !s || [m.player.fullName, m.player.username, m.from?.name, m.to?.name].some((v) => String(v || "").toLowerCase().includes(s));
      }),
    [feed, type, club, s]
  );
  useEffect(() => setShown(PAGE), [type, club, s]);

  return (
    <div className="space-y-5">
      {busiest.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200 p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Busiest clubs</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {busiest.map(({ club: c, n }) => (
              <button
                key={c.slug}
                onClick={() => setClub(club === c.slug ? "" : c.slug)}
                className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors ${club === c.slug ? "border-black bg-black text-white" : "border-slate-200 hover:border-slate-400"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.logo} alt="" className="w-7 h-7 rounded-lg object-cover bg-white" />
                <span className="text-xs font-bold">{c.name}</span>
                <span className={`text-[10px] font-black ${club === c.slug ? "text-white/60" : "text-slate-400"}`}>{n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search player or club…" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-black" />
        </div>
        <select value={club} onChange={(e) => setClub(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-black" aria-label="Filter by club">
          <option value="">All clubs</option>
          {clubs.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="inline-flex self-start rounded-xl bg-white border border-slate-200 p-1">
          {([
            ["all", "All"],
            ["join", "Joined"],
            ["transfer", "Club to club"],
            ["out", "Left / ended"],
          ] as const).map(([v, l]) => (
            <button key={v} onClick={() => setType(v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${type === v ? "bg-black text-white" : "text-slate-600 hover:text-black"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {!list.length ? (
        <div className="rounded-3xl bg-white border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">No moves match.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.slice(0, shown).map((m) => {
            const t = TYPE[m.type] || TYPE.free;
            const out = m.type === "released" || m.type === "expired";
            return (
              <div key={m.id} className="rounded-2xl bg-white border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${t.tone}`}>{t.label}</span>
                  <span className="text-[11px] font-semibold text-slate-400" title={formatDate(m.date)}>
                    {formatRelativeTime(m.date)}
                  </span>
                </div>

                <Link href={m.player.username ? `/players/${m.player.username}` : "#"} className="flex items-center gap-3 min-w-0 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.player.avatar} alt="" loading="lazy" className="w-12 h-12 rounded-full object-cover bg-slate-100 ring-2 ring-[#C79A3B]/60" />
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-950 truncate group-hover:underline">{m.player.fullName}</div>
                    <div className="text-[11px] text-slate-500">
                      {m.player.position || "Player"}
                      {m.player.rating ? ` · ${m.player.rating}` : ""}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <ClubMark c={m.from} dim />
                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">From</div>
                      <div className="text-xs font-bold text-slate-600 line-clamp-2 break-words leading-tight">{clubName(m.from)}</div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 shrink-0 ${out ? "text-rose-400" : "text-[#C79A3B]"}`} />
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">To</div>
                      <div className="text-xs font-black text-slate-950 line-clamp-2 break-words leading-tight">{clubName(m.to)}</div>
                    </div>
                    <ClubMark c={m.to} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500">
                    {formatDate(m.date)}
                    {!out && m.contractEnd ? (
                      <>
                        {" "}→ <b className="text-slate-700">{formatDate(m.contractEnd)}</b>
                      </>
                    ) : null}
                    {m.fee ? ` · ${formatCurrency(m.fee)}` : ""}
                  </span>
                  {m.postLink && (
                    <a href={m.postLink} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100">
                      <Facebook className="w-3 h-3" /> Post
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shown < list.length && (
        <div className="text-center">
          <button onClick={() => setShown((n) => n + PAGE)} className="px-6 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800">
            Show more <span className="text-white/50 font-mono text-xs ml-1">{shown}/{list.length}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------- Available players

function Available({ players }: { players: any[] }) {
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "free" | "noclub">("all");
  const [shown, setShown] = useState(PAGE);
  const s = q.trim().toLowerCase();
  const list = useMemo(
    () =>
      players.filter((p) => {
        if (p.club) return false;
        if (only === "free" && !isFreeAgent(p)) return false;
        if (only === "noclub" && isFreeAgent(p)) return false;
        return !s || [p.fullName, p.username, p.konamiId, p.preferredPosition].some((v) => String(v || "").toLowerCase().includes(s));
      }),
    [players, s, only]
  );
  useEffect(() => setShown(PAGE), [s, only]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
        <UserPlus className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-900">
          These players aren&apos;t in any club and can be signed. Club managers sign them from <b>Club Control Center → Transfer Window</b>; every signing is approved by the admins.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, UID or position…" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-black" />
        </div>
        <div className="inline-flex self-start rounded-xl bg-white border border-slate-200 p-1">
          {([
            ["all", "All available"],
            ["noclub", "No club"],
            ["free", "Free Agents"],
          ] as const).map(([v, l]) => (
            <button key={v} onClick={() => setOnly(v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${only === v ? "bg-black text-white" : "text-slate-600 hover:text-black"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {!list.length ? (
        <div className="rounded-3xl bg-white border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">No available players match.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {list.slice(0, shown).map((p) => {
            const fa = isFreeAgent(p);
            return (
              <Link key={p.id} href={`/players/${p.username}`} className="group rounded-2xl bg-white border border-slate-200 p-4 text-center hover:shadow-md hover:border-emerald-300 transition-all">
                <span className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar} alt="" loading="lazy" className="w-16 h-16 rounded-full object-cover bg-slate-100 ring-2 ring-emerald-400/60" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white">
                    <Unlock className="w-3 h-3" />
                  </span>
                </span>
                <div className="mt-2.5 text-sm font-black text-slate-950 truncate group-hover:underline">{p.fullName}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {p.preferredPosition} · {ratingText(p)}
                </div>
                <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${fa ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>{fa ? "Free Agent" : "No club"}</span>
              </Link>
            );
          })}
        </div>
      )}
      {shown < list.length && (
        <div className="text-center">
          <button onClick={() => setShown((n) => n + PAGE)} className="px-6 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800">
            Show more <span className="text-white/50 font-mono text-xs ml-1">{shown}/{list.length}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------- Contracts ending

function Ending({ players, nextEnd }: { players: any[]; nextEnd: string | null }) {
  const list = useMemo(
    () =>
      players
        .filter((p) => p.club && contractDaysLeft(p.contract?.endDate) > 0 && contractDaysLeft(p.contract?.endDate) <= 30)
        .sort((a, b) => new Date(a.contract.endDate).getTime() - new Date(b.contract.endDate).getTime()),
    [players]
  );
  if (!list.length)
    return (
      <div className="rounded-3xl bg-white border border-slate-200 py-16 px-6 text-center">
        <CalendarClock className="w-10 h-10 mx-auto text-slate-300" />
        <p className="mt-3 text-sm font-bold text-slate-800">No contracts end in the next 30 days</p>
        <p className="text-xs text-slate-500 mt-1">
          Every club contract runs for {CONTRACT_DAYS} days.{nextEnd ? ` The next one ends on ${formatDate(nextEnd)}.` : ""} When it ends the player becomes a Free Agent.
        </p>
      </div>
    );
  return (
    <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {list.map((p) => {
          const left = contractDaysLeft(p.contract.endDate);
          return (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100" />
              <div className="min-w-0 flex-1">
                <Link href={`/players/${p.username}`} className="text-sm font-bold text-slate-950 hover:underline truncate block">{p.fullName}</Link>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.club.logo} alt="" className="w-4 h-4 rounded object-cover" />
                  <span className="truncate">{p.club.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-black font-mono ${left <= 7 ? "text-rose-600" : "text-amber-600"}`}>{left}d</div>
                <div className="text-[10px] text-slate-400">ends {formatDate(p.contract.endDate)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------- Transfer list (admin listings)

function Listed({ listings, me }: { listings: any[]; me: any }) {
  const canBid = !!me && me.isManager && me.status === "ACTIVE";
  const offer = async (l: any) => {
    const fee = await promptDialog({ title: `Offer for ${l.player.fullName}`, text: `Asking price ${formatCurrency(l.askingPrice)} · your offer in $M`, value: String(l.askingPrice || ""), inputType: "number", confirmText: "Send offer" });
    if (!fee) return;
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: l.player.id, targetClubId: me.id, offeredFee: Number(fee), message: "" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Could not send the offer");
      toast.success("Offer sent to the admins");
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {listings.map((l) => (
        <div key={l.id} className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.player.avatar} alt="" className="w-12 h-12 rounded-full object-cover bg-slate-100" />
            <div className="min-w-0 flex-1">
              <Link href={`/players/${l.player.username}`} className="text-sm font-black text-slate-950 hover:underline truncate block">{l.player.fullName}</Link>
              <div className="text-[11px] text-slate-500 truncate">{l.player.club?.name || "No club"}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black uppercase text-slate-400">Asking</div>
              <div className="text-sm font-black font-mono text-emerald-700">{formatCurrency(l.askingPrice)}</div>
            </div>
          </div>
          {canBid ? (
            <button onClick={() => offer(l)} className="w-full py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800">Make an offer</button>
          ) : (
            <div className="text-[11px] text-slate-400 text-center">Club managers can make offers</div>
          )}
        </div>
      ))}
    </div>
  );
}
