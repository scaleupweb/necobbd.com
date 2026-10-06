"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Shield,
  Trophy,
  Swords,
  Radio,
  AlertCircle,
  Timer,
  ArrowRight,
  UserPlus,
  ArrowRightLeft,
  Hourglass,
  BadgeCheck,
  Snowflake,
  Armchair,
  ClipboardCheck,
  Gavel,
  Newspaper,
  Palette,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { api, Badge, Empty, Notice, statusTone } from "@/components/admin/ui";
import { formatDate, formatTime, formatRelativeTime } from "@/lib/utils";
import { SQUAD_LIMIT, CONTRACT_DAYS, contractDaysLeft } from "@/lib/squad";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { toast, confirmDialog } from "@/lib/feedback";

const TYPE_LABEL: Record<string, string> = { free: "joined", signing: "signed for", transfer: "moved to", released: "left", expired: "contract ended at" };

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const load = () => api("/api/admin/overview").then(setData).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  if (error) return <Notice kind="err">{error}</Notice>;
  if (!data)
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
      </div>
    );

  const { insights: ins, stats, liveFixtures, pendingFixtures, pendingResults, pendingClubEntries = [], countdown, auditLogs, recentUsers, isAdmin } = data;
  const p = ins.players;
  const cdActive = countdown.enabled && countdown.targetDate && new Date(countdown.targetDate).getTime() > Date.now();

  const attention = [
    { label: "Transfer requests", value: ins.transfers.pendingSigning + ins.transfers.pendingOffers, hint: "Signings & offers waiting", href: "/admin/transfers", icon: ArrowRightLeft, tone: "amber" },
    { label: "Club approvals", value: ins.clubs.pending.length, hint: "New clubs to review", href: "/admin/clubs", icon: Shield, tone: "sky" },
    { label: "Tournament entries", value: pendingClubEntries.length, hint: "Club registrations to approve", href: "/admin/tournaments", icon: Trophy, tone: "amber" },
    { label: "Match results", value: pendingResults.length, hint: "Reported scores to confirm", href: "/admin/fixtures", icon: ClipboardCheck, tone: "violet" },
    { label: "Contracts ending", value: ins.contractsEnding.length, hint: "End within 30 days", href: "/transfer-market", icon: Hourglass, tone: "rose" },
    { label: "Player verification", value: p.pendingVerification, hint: "Accounts waiting to be verified", href: "/admin/players", icon: BadgeCheck, tone: "emerald" },
  ];
  const tones: Record<string, string> = {
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    sky: "bg-sky-50 border-sky-200 text-sky-800",
    violet: "bg-violet-50 border-violet-200 text-violet-800",
    rose: "bg-rose-50 border-rose-200 text-rose-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
  };
  const pct = (n: number) => (p.total ? Math.round((n / p.total) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* ================= Header ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0B0C0F] text-white p-6 sm:p-8">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(199,154,59,0.28),transparent_50%),radial-gradient(ellipse_at_0%_100%,rgba(99,102,241,0.18),transparent_45%)]" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C79A3B]">Admin command center</div>
            <h1 className="mt-1 text-2xl sm:text-4xl font-black tracking-tight">NECOB at a glance</h1>
            <p className="text-sm text-white/60 mt-1">
              {formatDate(new Date().toISOString())} · {p.total} players · {ins.clubs.active} active clubs · {stats.registeredUsers} accounts
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["/admin/transfers", "Transfers", ArrowRightLeft],
              ["/admin/clubs", "Clubs", Shield],
              ["/admin/tournaments", "Tournaments", Trophy],
              ...(isAdmin ? [["/admin/site", "Homepage", Palette], ["/admin/news", "News", Newspaper]] : []),
            ].map(([href, label, Icon]: any) => (
              <Link key={href} href={href} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold hover:bg-white/15">
                <Icon className="w-3.5 h-3.5" /> {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Needs attention ================= */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Needs attention</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {attention.map((a) => {
            const hot = a.value > 0;
            return (
              <Link
                key={a.label}
                href={a.href}
                className={`group p-4 rounded-2xl border transition-all hover:shadow-md ${hot ? tones[a.tone] : "bg-white border-slate-200 text-slate-500"}`}
              >
                <div className="flex items-center justify-between">
                  <a.icon className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className={`mt-2 text-3xl font-black font-mono ${hot ? "" : "text-slate-300"}`}>{a.value}</div>
                <div className={`text-xs font-black ${hot ? "" : "text-slate-700"}`}>{a.label}</div>
                <div className="text-[11px] opacity-80">{a.hint}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================= KPIs ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Players */}
        <Link href="/admin/players" className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-slate-400 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">Players</div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1 text-4xl font-black font-mono text-slate-950">{p.total}</div>
          <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: `${pct(p.inClub)}%` }} title="In a club" />
            <div className="h-full bg-sky-400" style={{ width: `${pct(p.noClub)}%` }} title="No club" />
            <div className="h-full bg-amber-400" style={{ width: `${pct(p.freeAgents)}%` }} title="Free Agents" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            <Legend color="bg-emerald-500" label="In a club" value={p.inClub} />
            <Legend color="bg-sky-400" label="No club" value={p.noClub} />
            <Legend color="bg-amber-400" label="Free Agents" value={p.freeAgents} />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1"><VerifiedBadge className="w-4 h-4" /> {p.verified} verified</span>
            <span className="inline-flex items-center gap-1"><Snowflake className="w-3.5 h-3.5 text-sky-500" /> {p.frozen} frozen now</span>
          </div>
        </Link>

        {/* Clubs */}
        <Link href="/admin/clubs" className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-slate-400 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">Clubs</div>
            <Shield className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1 text-4xl font-black font-mono text-slate-950">{ins.clubs.active}</div>
          <div className="text-[11px] text-slate-500">active of {ins.clubs.total} registered</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="Pending" value={ins.clubs.pending.length} />
            <MiniStat label={`Full ${SQUAD_LIMIT}/${SQUAD_LIMIT}`} value={ins.clubs.full} />
            <MiniStat label="No manager" value={ins.clubs.withoutManager} />
          </div>
        </Link>

        {/* Transfers */}
        <Link href="/admin/transfers" className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-slate-400 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">Transfers</div>
            <ArrowRightLeft className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1 text-4xl font-black font-mono text-slate-950">{stats.totalTransfers}</div>
          <div className="text-[11px] text-slate-500">moves recorded · {CONTRACT_DAYS}-day contracts</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="Last 7 days" value={ins.transfers.last7} />
            <MiniStat label="Last 30 days" value={ins.transfers.last30} />
            <MiniStat label="Pending" value={ins.transfers.pendingSigning + ins.transfers.pendingOffers} />
          </div>
        </Link>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          ["Accounts", stats.registeredUsers, UserPlus, "/admin/users"],
          ["New · 7 days", ins.users.newLast7, UserPlus, "/admin/users"],
          ["Tournaments", stats.activeTournaments, Trophy, "/admin/tournaments"],
          ["Matches played", stats.completedMatches, Swords, "/admin/fixtures"],
          ["Live now", stats.liveMatches, Radio, "/admin/live"],
          ["Officials", stats.registeredOfficials, Gavel, "/admin/referees"],
        ].map(([label, value, Icon, href]: any) => (
          <Link key={label} href={href} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 transition-colors">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
              {label} <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-slate-950 font-mono mt-1">{value}</div>
          </Link>
        ))}
      </section>

      {/* ================= Work lists ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Transfer requests waiting" href="/admin/transfers" link="Review all">
          {ins.transfers.requests.length ? (
            ins.transfers.requests.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.player.avatar} alt="" className="w-9 h-9 rounded-full object-cover bg-slate-100" />
                <div className="min-w-0 flex-1 text-xs">
                  <div className="font-bold text-slate-950 truncate">
                    {r.player.name} <span className="text-slate-400 font-normal">→</span> {r.club?.name}
                  </div>
                  <div className="text-slate-500">Seat {r.seat} · requested {formatRelativeTime(r.createdAt)}</div>
                </div>
                {r.club?.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.club.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                )}
              </div>
            ))
          ) : (
            <Empty>No signing requests waiting.</Empty>
          )}
        </Panel>

        <Panel title="Clubs waiting for approval" href="/admin/clubs" link="Open clubs">
          {ins.clubs.pending.length ? (
            ins.clubs.pending.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5 text-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.logo} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-950 truncate">{c.name}</div>
                  <div className="text-slate-500">{c.shortName}{c.createdAt ? ` · registered ${formatRelativeTime(c.createdAt)}` : ""}</div>
                </div>
                <Badge tone="amber">PENDING</Badge>
              </div>
            ))
          ) : (
            <Empty>No clubs waiting for approval.</Empty>
          )}
        </Panel>

        <Panel title="Tournament registrations waiting for approval" href="/admin/tournaments" link="Open tournaments">
          {pendingClubEntries.length ? (
            pendingClubEntries.map((e: any) => <PendingEntryRow key={`${e.tournamentId}-${e.clubId}`} entry={e} onDone={load} />)
          ) : (
            <Empty>No tournament registrations waiting.</Empty>
          )}
        </Panel>

        <Panel title="Main Team Squads" href="/admin/clubs" link="All clubs">
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {ins.clubs.squads.slice(0, 15).map((c: any) => {
              const full = c.count >= SQUAD_LIMIT;
              return (
                <div key={c.id} className="flex items-center gap-3 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.logo} alt="" className="w-7 h-7 rounded-lg object-cover bg-slate-100" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <Link href={`/clubs/${c.slug}`} target="_blank" className="font-bold text-slate-900 truncate hover:underline">{c.name}</Link>
                      <span className={`font-mono font-black ${full ? "text-rose-600" : "text-slate-600"}`}>
                        {c.count}/{SQUAD_LIMIT}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${full ? "bg-rose-500" : "bg-gradient-to-r from-emerald-400 to-[#C79A3B]"}`} style={{ width: `${Math.min(100, (c.count / SQUAD_LIMIT) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 inline-flex items-center gap-1">
            <Armchair className="w-3.5 h-3.5" /> Every club has {SQUAD_LIMIT} seats in its Main Team Squad.
          </div>
        </Panel>

        <Panel title="Contracts ending soon" href="/transfer-market" link="Transfer market">
          {ins.contractsEnding.length ? (
            ins.contractsEnding.map((c: any) => {
              const left = contractDaysLeft(c.endDate);
              return (
                <div key={c.username} className="flex items-center gap-3 py-2.5 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.avatar} alt="" className="w-9 h-9 rounded-full object-cover bg-slate-100" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/players/${c.username}`} target="_blank" className="font-bold text-slate-950 truncate hover:underline block">{c.name}</Link>
                    <div className="text-slate-500 truncate">{c.club?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-black ${left <= 7 ? "text-rose-600" : "text-amber-600"}`}>{left}d</div>
                    <div className="text-[10px] text-slate-400">{formatDate(c.endDate)}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty>No contract ends in the next 30 days.</Empty>
          )}
        </Panel>

        <Panel title="Latest transfers" href="/transfer-market" link="Public feed">
          {ins.transfers.recent.length ? (
            ins.transfers.recent.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 py-2.5 text-xs">
                <ArrowRightLeft className="w-4 h-4 text-slate-300 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-950">{m.player}</span>{" "}
                  <span className="text-slate-500">{TYPE_LABEL[m.type] || "joined"}</span>{" "}
                  <span className="font-bold text-slate-900">{(m.type === "released" || m.type === "expired" ? m.from : m.to)?.name || "No club"}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{formatRelativeTime(m.date)}</span>
              </div>
            ))
          ) : (
            <Empty>No transfers yet.</Empty>
          )}
        </Panel>

        <Panel title="Tournaments open" href="/admin/tournaments" link="Manage">
          {ins.tournaments.length ? (
            ins.tournaments.map((t: any) => (
              <div key={t.slug} className="py-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/tournaments/${t.slug}`} target="_blank" className="font-bold text-slate-950 truncate hover:underline">{t.name}</Link>
                  <Badge tone={statusTone(t.status)}>{t.status.replace(/_/g, " ")}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${t.max ? Math.min(100, (t.clubs / t.max) * 100) : 0}%` }} />
                  </div>
                  <span className="font-mono text-slate-600">
                    {t.clubs}/{t.max} clubs
                  </span>
                </div>
              </div>
            ))
          ) : (
            <Empty>No tournament is open or running.</Empty>
          )}
        </Panel>
      </div>

      {/* ================= Operations ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Link href="/admin/countdown" className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${cdActive ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3">
            <Timer className={`w-8 h-8 ${cdActive ? "text-emerald-700" : "text-slate-400"}`} />
            <div>
              <div className="text-sm font-black text-slate-950">Registration countdown is {cdActive ? "ON" : "OFF"}</div>
              <div className="text-xs text-slate-600">{cdActive ? `${countdown.title} · ends ${formatDate(countdown.targetDate)} ${formatTime(countdown.targetDate)}` : "Start a countdown on the homepage."}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>
        <Link href="/admin/fixtures" className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${pendingResults.length ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-8 h-8 ${pendingResults.length ? "text-amber-600" : "text-slate-400"}`} />
            <div>
              <div className="text-sm font-black text-slate-950">{pendingResults.length} result(s) awaiting approval</div>
              <div className="text-xs text-slate-600">Reported scores need an official to confirm them.</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Live matches" href="/admin/live" link="Open desk">
          {liveFixtures.length ? liveFixtures.map((f: any) => <FixtureLine key={f.id} f={f} />) : <Empty>No matches are live right now.</Empty>}
        </Panel>
        <Panel title="Next scheduled" href="/admin/fixtures" link="All fixtures">
          {pendingFixtures.length ? pendingFixtures.map((f: any) => <FixtureLine key={f.id} f={f} />) : <Empty>No upcoming fixtures.</Empty>}
        </Panel>

        {recentUsers.length > 0 && (
          <Panel title="Newest sign-ups" href="/admin/users" link="Manage">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-2 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-950 truncate">{u.fullName}</div>
                  <div className="text-slate-500 truncate">@{u.username} · {u.email}</div>
                </div>
                <div className="text-right space-y-0.5 shrink-0">
                  <Badge tone={statusTone(u.status)}>{u.role.replace(/_/g, " ")}</Badge>
                  <div className="text-[10px] text-slate-400">{formatRelativeTime(u.createdAt)}</div>
                </div>
              </div>
            ))}
          </Panel>
        )}

        {auditLogs.length > 0 && (
          <Panel title="Recent admin actions" href="/admin/audit-logs" link="Audit log">
            {auditLogs.map((l: any) => (
              <div key={l.id} className="py-2 text-xs">
                <span className="font-bold text-slate-950">{l.adminName}</span> <span className="font-mono text-slate-600">{l.action}</span> <span className="text-slate-700">{l.target}</span>
                <div className="text-[10px] text-slate-400">{formatRelativeTime(l.createdAt)}</div>
              </div>
            ))}
          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({ title, href, link, children }: { title: string; href: string; link: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-black text-slate-950">{title}</h2>
        <Link href={href} className="text-xs font-bold text-slate-500 hover:text-black">
          {link} →
        </Link>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-slate-500">
        <span className={`w-2 h-2 rounded-full ${color}`} /> {label}
      </div>
      <div className="font-mono font-black text-slate-900 text-sm">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2">
      <div className="font-mono font-black text-slate-900 text-lg leading-none">{value}</div>
      <div className="text-[10px] font-bold text-slate-500 mt-1 truncate">{label}</div>
    </div>
  );
}

function FixtureLine({ f }: { f: any }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-xs">
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

function PendingEntryRow({ entry: e, onDone }: { entry: any; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const act = async (action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !(await confirmDialog({ title: `Reject ${e.club?.name || "this club"}?`, text: `Its registration for ${e.tournament} will be rejected and the manager notified.`, confirmText: "Reject", danger: true }))) return;
    setBusy(true);
    try {
      await api(`/api/admin/tournaments/${e.tournamentId}/participants`, { method: "PATCH", json: { clubId: e.clubId, action } });
      toast.success(action === "APPROVE" ? `${e.club?.name || "Club"} approved for ${e.tournament}` : "Registration rejected");
      onDone();
    } catch (err: any) {
      toast.error(err.message);
      setBusy(false);
    }
  };
  return (
    <div className="flex items-center gap-3 py-2.5 text-xs">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={e.club?.logo} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" />
      <div className="min-w-0 flex-1">
        <div className="font-bold text-slate-950 truncate">{e.club?.name || "Unknown club"}</div>
        <div className="text-slate-500 truncate">
          <Link href={`/tournaments/${e.tournamentSlug}`} target="_blank" className="hover:underline">{e.tournament}</Link> · {formatRelativeTime(e.joinedAt)}
        </div>
      </div>
      <button onClick={() => act("APPROVE")} disabled={busy} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
      </button>
      <button onClick={() => act("REJECT")} disabled={busy} title="Reject" className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
