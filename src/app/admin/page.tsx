"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Shield, Trophy, Swords, Radio, AlertCircle, Timer, ArrowRight, UserPlus, Goal, ArrowRightLeft } from "lucide-react";
import { api, Badge, Empty, Notice, PageHeader, statusTone } from "@/components/admin/ui";
import { formatDate, formatTime, formatRelativeTime } from "@/lib/utils";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/admin/overview").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <Notice kind="err">{error}</Notice>;
  if (!data) return <div className="py-20 text-center text-xs text-slate-500 animate-pulse">Loading dashboard…</div>;

  const { stats, liveFixtures, pendingFixtures, pendingResults, countdown, auditLogs, recentUsers } = data;
  const tiles = [
    { label: "Players", value: stats.registeredPlayers, icon: Users, href: "/admin/players" },
    { label: "User accounts", value: stats.registeredUsers, icon: UserPlus, href: "/admin/users" },
    { label: "Active clubs", value: stats.activeClubs, icon: Shield, href: "/admin/clubs" },
    { label: "Active tournaments", value: stats.activeTournaments, icon: Trophy, href: "/admin/tournaments" },
    { label: "Matches played", value: stats.completedMatches, icon: Swords, href: "/admin/fixtures" },
    { label: "Live now", value: stats.liveMatches, icon: Radio, href: "/admin/live" },
    { label: "Goals recorded", value: stats.totalGoalsScored, icon: Goal },
    { label: "Transfers", value: stats.totalTransfers, icon: ArrowRightLeft, href: "/admin/transfers" },
  ];
  const cdActive = countdown.enabled && countdown.targetDate && new Date(countdown.targetDate).getTime() > Date.now();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Everything happening on the platform at a glance." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => {
          const body = (
            <>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                {t.label} <t.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-950 font-mono mt-1">{t.value}</div>
            </>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-black shadow-sm transition-colors">
              {body}
            </Link>
          ) : (
            <div key={t.label} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Link href="/admin/countdown" className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between gap-4 ${cdActive ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3">
            <Timer className={`w-8 h-8 ${cdActive ? "text-emerald-700" : "text-slate-400"}`} />
            <div>
              <div className="text-sm font-black text-slate-950">Registration countdown is {cdActive ? "ON" : "OFF"}</div>
              <div className="text-xs text-slate-600">{cdActive ? `${countdown.title} · ends ${formatDate(countdown.targetDate)} ${formatTime(countdown.targetDate)}` : "Start a countdown to open tournament registration on the homepage."}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>
        <Link href="/admin/fixtures" className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between gap-4 ${pendingResults.length ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-8 h-8 ${pendingResults.length ? "text-amber-600" : "text-slate-400"}`} />
            <div>
              <div className="text-sm font-black text-slate-950">{pendingResults.length} result(s) awaiting approval</div>
              <div className="text-xs text-slate-600">Player-reported scores need an official to confirm them.</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-950">Live matches</h2>
            <Link href="/admin/live" className="text-xs font-bold hover:underline">Open desk →</Link>
          </div>
          {liveFixtures.length ? (
            liveFixtures.map((f: any) => <FixtureLine key={f.id} f={f} />)
          ) : (
            <Empty>No matches are live right now.</Empty>
          )}
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-950">Next scheduled</h2>
            <Link href="/admin/fixtures" className="text-xs font-bold hover:underline">All fixtures →</Link>
          </div>
          {pendingFixtures.length ? (
            pendingFixtures.map((f: any) => <FixtureLine key={f.id} f={f} />)
          ) : (
            <Empty>No upcoming fixtures. Create one from Fixtures & Results.</Empty>
          )}
        </section>

        {recentUsers.length > 0 && (
          <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-950">Newest sign-ups</h2>
              <Link href="/admin/users" className="text-xs font-bold hover:underline">Manage →</Link>
            </div>
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-950">{u.fullName}</div>
                  <div className="text-slate-500">@{u.username} · {u.email}</div>
                </div>
                <div className="text-right space-y-0.5">
                  <Badge tone={statusTone(u.status)}>{u.role.replace(/_/g, " ")}</Badge>
                  <div className="text-[10px] text-slate-400">{formatRelativeTime(u.createdAt)}</div>
                </div>
              </div>
            ))}
          </section>
        )}

        {auditLogs.length > 0 && (
          <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-950">Recent admin actions</h2>
              <Link href="/admin/audit-logs" className="text-xs font-bold hover:underline">Audit log →</Link>
            </div>
            {auditLogs.map((l: any) => (
              <div key={l.id} className="text-xs">
                <span className="font-bold text-slate-950">{l.adminName}</span> <span className="font-mono text-slate-600">{l.action}</span>{" "}
                <span className="text-slate-700">{l.target}</span>
                <div className="text-[10px] text-slate-400">{formatRelativeTime(l.createdAt)}</div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function FixtureLine({ f }: { f: any }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 text-xs">
      <div className="min-w-0">
        <div className="font-bold text-slate-950 truncate">
          {f.homePlayer?.fullName || f.homeClub?.name} vs {f.awayPlayer?.fullName || f.awayClub?.name}
        </div>
        <div className="text-slate-500 truncate">
          {[f.tournamentName, f.round].filter(Boolean).join(" · ")} · {formatDate(f.scheduledDate)} {formatTime(f.scheduledDate)}
        </div>
      </div>
      {f.status === "LIVE" ? (
        <span className="font-mono font-black">
          {f.liveScore.home} - {f.liveScore.away} <Badge tone="red">{f.minute}</Badge>
        </span>
      ) : (
        <Badge tone={statusTone(f.status)}>{f.status}</Badge>
      )}
    </div>
  );
}
