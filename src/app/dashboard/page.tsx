"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Swords,
  Calendar,
  Bell,
  ArrowRight,
  User,
  Lock,
  LayoutDashboard,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency, getFormColor, formatDate, formatTime, formatRelativeTime } from "@/lib/utils";
import { PLAYER_POSITIONS, PLAY_STYLES, DEVICE_MODELS } from "@/lib/constants";
import { ImageInput } from "@/components/ui/ImageInput";
import { toast, confirmDialog, postLinkDialog } from "@/lib/feedback";
import { LocationInput } from "@/components/ui/LocationInput";
import { noClubLabel, ratingText } from "@/lib/squad";
import { PasswordInput } from "@/components/ui/PasswordInput";

type Tab = "overview" | "profile" | "security";

const input =
  "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs";

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/me/overview", { cache: "no-store" });
      const json = await res.json();
      if (!json.success) {
        if (res.status === 401) window.location.href = "/login?next=/dashboard";
        throw new Error(json.error?.message || "Failed to load dashboard");
      }
      setData(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "profile" || t === "security") setTab(t);
    load();
  }, [load]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-600 font-bold animate-pulse text-sm">Loading your dashboard…</div>;
  }
  if (error || !data) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-rose-600 font-bold text-sm">{error || "Something went wrong"}</div>;
  }

  const { user, player } = data;
  const isStaff = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "TOURNAMENT_OFFICIAL", "SENIOR_REFEREE", "REFEREE"].includes(user.role);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={player?.avatar || user.avatar || "/images/placeholders/avatar.svg"} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200" />
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{player ? "Player" : user.role.replace(/_/g, " ")}</div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-950">Hi, {user.fullName.split(" ")[0]}!</h1>
            <div className="text-xs text-slate-500 font-mono">@{user.username}</div>
          </div>
        </div>
        {player && (
          <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto">
            <Kpi label="Rating" value={ratingText(player)} />
            <Kpi label="Value" value={formatCurrency(player.marketValue)} />
            <Kpi label="Win rate" value={`${player.stats.winRate}%`} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {([
          ["overview", "Overview", LayoutDashboard],
          ["profile", "Edit Profile", User],
          ["security", "Password & Security", Lock],
        ] as const).map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === k ? "bg-black text-white" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
        {(player || isStaff) && (
          <div className="ml-auto flex items-center gap-2">
            {isStaff && (
              <Link href="/admin" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0B0C0F] text-[#F7DC8B] hover:bg-black whitespace-nowrap">
                <ShieldAlert className="w-3.5 h-3.5" /> Admin Panel
              </Link>
            )}
            {player && (
              <Link href={`/players/${player.username}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:border-black whitespace-nowrap">
                <ExternalLink className="w-3.5 h-3.5" /> View public profile
              </Link>
            )}
          </div>
        )}
      </div>

      {tab === "overview" && <Overview data={data} reload={load} />}
      {tab === "profile" && <ProfileForm player={player} user={user} onSaved={load} />}
      {tab === "security" && <SecurityForm />}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
      <div className="text-[10px] text-slate-500 uppercase font-bold">{label}</div>
      <div className="text-lg sm:text-xl font-black text-slate-950 font-mono">{value}</div>
    </div>
  );
}

function Card({ title, icon: Icon, action, children }: { title: string; icon: any; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
          <Icon className="w-4 h-4" /> {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Overview({ data, reload }: { data: any; reload: () => void }) {
  const { player, tournaments, events, fixtures, activity, notifications, openTournaments } = data;
  // Registration is only for the club's main manager (not moderators).
  const managedClub = data.managedClub?.isOwner ? data.managedClub : null;
  const [joining, setJoining] = useState<string | null>(null);
  const upcoming = fixtures.filter((f: any) => f.status === "SCHEDULED" || f.status === "LIVE");
  const recent = fixtures.filter((f: any) => f.status === "FINISHED").slice(0, 5);

  // Only a club's main manager can register the club for a tournament.
  const join = async (slug: string) => {
    const postLink = await postLinkDialog({ title: `Register ${managedClub?.name || "your club"}`, text: "Post your registration on Facebook, then paste the post link here. An admin checks it before approving." });
    if (!postLink) return;
    setJoining(slug);
    try {
      const res = await fetch(`/api/tournaments/${slug}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postLink }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      toast.success("Registration sent — waiting for admin approval");
      reload();
    } catch (e: any) {
      toast.error(e.message || "Could not register the club");
    } finally {
      setJoining(null);
    }
  };

  const leaveClub = async () => {
    const yes = await confirmDialog({
      title: `Leave ${player.club.name}?`,
      text: "You will have no club and can join or be signed by another club.",
      confirmText: "Leave club",
      danger: true,
    });
    if (!yes) return;
    try {
      const res = await fetch("/api/me/leave-club", { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Could not leave the club");
      toast.success(`You left ${player.club.name}`);
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        {openTournaments.length > 0 && (
          <Card title="Open for registration" icon={Trophy} action={<Link href="/tournaments" className="text-xs font-bold hover:underline">All →</Link>}>
            {!managedClub && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                Tournaments are for clubs. Only a club&apos;s main manager can register — ask your manager, or{" "}
                <Link href="/register?type=club" className="font-bold underline">create a club</Link>.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {openTournaments.map((t: any) => (
                <div key={t.id} className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <Link href={`/tournaments/${t.slug}`} className="text-sm font-bold text-black hover:underline line-clamp-1">{t.name}</Link>
                  <div className="text-[11px] text-slate-500">
                    {t.currentParticipants}/{t.maxParticipants} joined
                    {t.registrationDeadline && ` · closes ${formatDate(t.registrationDeadline)}`}
                    {t.prizePool && ` · ${t.prizePool}`}
                  </div>
                  {managedClub ? (
                    <button
                      onClick={() => join(t.slug)}
                      disabled={joining === t.slug || managedClub.status !== "ACTIVE"}
                      className="w-full py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {joining === t.slug && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {managedClub.status === "ACTIVE" ? `Register ${managedClub.name}` : "Club awaiting approval"}
                    </button>
                  ) : (
                    <Link href={`/tournaments/${t.slug}`} className="block w-full py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold text-center hover:bg-slate-200">
                      View tournament
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card title="My matches" icon={Swords} action={<Link href="/matches" className="text-xs font-bold hover:underline">Match centre →</Link>}>
          {upcoming.length === 0 && recent.length === 0 && <p className="text-xs text-slate-500">No matches scheduled for you yet. Join a tournament to get fixtures.</p>}
          {upcoming.map((f: any) => (
            <MatchCard key={f.id} f={f} playerId={player?.id} onReported={reload} />
          ))}
          {recent.length > 0 && <div className="text-[11px] font-bold text-slate-500 uppercase pt-2">Recent results</div>}
          {recent.map((f: any) => (
            <MatchCard key={f.id} f={f} playerId={player?.id} onReported={reload} />
          ))}
        </Card>

        <Card title={`My tournaments (${tournaments.length})`} icon={Trophy}>
          {tournaments.length ? (
            <div className="divide-y divide-slate-100">
              {tournaments.map((t: any) => (
                <Link key={t.id} href={`/tournaments/${t.slug}`} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3 group">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-black truncate group-hover:underline">{t.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {t.status.replace(/_/g, " ").toLowerCase()} · {t.currentParticipants}/{t.maxParticipants} players
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">You haven&apos;t joined any tournaments yet.</p>
          )}
        </Card>

        {events.length > 0 && (
          <Card title={`My events (${events.length})`} icon={Calendar}>
            <div className="divide-y divide-slate-100">
              {events.map((e: any) => (
                <Link key={e.id} href={`/events#${e.slug}`} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-black truncate">{e.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{e.venue}</div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 shrink-0">{formatDate(e.eventDate)}</span>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card title="My club" icon={Trophy}>
          {data.managedClub ? (
            <Link href="/dashboard/my-club" className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.managedClub.logo || "/images/placeholders/club.svg"} alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-black truncate">{data.managedClub.name}</div>
                <div className="text-[11px] text-slate-500">{data.managedClub.status === "PENDING" ? "Waiting for admin approval" : "You manage this club"}</div>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : player?.club ? (
            <Link href={`/clubs/${player.club.slug}`} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={player.club.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-black truncate">{player.club.name}</div>
                <div className="text-[11px] text-slate-500">You play for this club{player.shirtNo ? ` · #${player.shirtNo}` : ""}</div>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Own or run a club? Create it from your account — no separate login needed.</p>
              <Link href="/register?type=club" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold">
                Create a club <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
          {player?.club && !data.managedClub?.isOwner && (
            <button onClick={leaveClub} className="w-full text-center text-xs font-bold text-rose-600 hover:underline pt-1">
              Leave {player.club.name}
            </button>
          )}
        </Card>
        {player && (
          <Card title="Form & stats" icon={LayoutDashboard}>
            <div className="flex gap-1.5">
              {player.form.length ? (
                player.form.map((r: string, i: number) => (
                  <span key={i} className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center border ${getFormColor(r)}`}>{r}</span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No matches played yet</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Kpi label="Played" value={player.stats.matchesPlayed} />
              <Kpi label="Goals" value={player.stats.goalsScored} />
              <Kpi label="MOTM" value={player.motmCount} />
            </div>
            <div className="text-xs text-slate-600">
              Club: <strong className="text-black">{player.club?.name || noClubLabel(player)}</strong>
            </div>
          </Card>
        )}

        <Card title="Notifications" icon={Bell} action={<Link href="/notifications" className="text-xs font-bold hover:underline">All →</Link>}>
          {notifications.length ? (
            <div className="space-y-3">
              {notifications.slice(0, 6).map((n: any) => (
                <div key={n.id} className="text-xs">
                  <div className={`font-bold ${n.read ? "text-slate-600" : "text-black"}`}>{n.title}</div>
                  {n.message && <div className="text-slate-500">{n.message}</div>}
                  <div className="text-[10px] text-slate-400">{formatRelativeTime(n.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">You&apos;re all caught up.</p>
          )}
        </Card>

        <Card title="Recent activity" icon={CheckCircle2}>
          {activity.length ? (
            <ul className="space-y-2.5">
              {activity.slice(0, 8).map((a: any) => (
                <li key={a.id} className="text-xs">
                  <div className="font-semibold text-black">{a.title}</div>
                  <div className="text-[10px] text-slate-400">{formatRelativeTime(a.createdAt)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">Nothing yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function MatchCard({ f, playerId, onReported }: { f: any; playerId?: string; onReported: () => void }) {
  const [open, setOpen] = useState(false);
  const [home, setHome] = useState("0");
  const [away, setAway] = useState("0");
  const [proof, setProof] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pending = f.result?.status === "PENDING";
  const canReport = (f.status === "LIVE" || f.status === "SCHEDULED") && !pending && playerId && (f.homePlayer?.id === playerId || f.awayPlayer?.id === playerId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/fixtures/${f.id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeScore: Number(home), awayScore: Number(away), proofScreenshot: proof }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setOpen(false);
      onReported();
    } catch (e: any) {
      setErr(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-slate-500">{[f.tournamentName, f.round].filter(Boolean).join(" · ")}</div>
          <div className="text-sm font-bold text-black">
            {f.homePlayer?.fullName || f.homeClub?.name} vs {f.awayPlayer?.fullName || f.awayClub?.name}
          </div>
          <div className="text-[11px] text-slate-500">
            {formatDate(f.scheduledDate)} {formatTime(f.scheduledDate)} · {f.venue}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {f.status === "FINISHED" && f.result ? (
            <span className="text-lg font-black font-mono">{f.result.homeScore} - {f.result.awayScore}</span>
          ) : (
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${f.status === "LIVE" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700"}`}>{f.status}</span>
          )}
          {pending && <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Result awaiting approval</span>}
          {canReport && (
            <button onClick={() => setOpen(!open)} className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold">
              Report result
            </button>
          )}
          <Link href={`/matches/${f.id}`} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold hover:border-black">
            Details
          </Link>
        </div>
      </div>
      {open && (
        <form onSubmit={submit} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="font-bold text-slate-700">{f.homePlayer?.fullName || "Home"} goals</span>
              <input type="number" min={0} max={99} value={home} onChange={(e) => setHome(e.target.value)} className={input} required />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-700">{f.awayPlayer?.fullName || "Away"} goals</span>
              <input type="number" min={0} max={99} value={away} onChange={(e) => setAway(e.target.value)} className={input} required />
            </label>
          </div>
          <ImageInput label="Screenshot proof (recommended)" value={proof} onChange={setProof} aspect="wide" />
          {err && <p className="text-rose-600 font-semibold">{err}</p>}
          <button disabled={busy} className="px-4 py-2 rounded-xl bg-black text-white font-bold disabled:opacity-60">
            {busy ? "Submitting…" : "Submit for official approval"}
          </button>
        </form>
      )}
    </div>
  );
}

function ProfileForm({ player, user, onSaved }: { player: any; user: any; onSaved: () => void }) {
  const [form, setForm] = useState({
    fullName: player?.fullName || user.fullName || "",
    avatar: player?.avatar?.startsWith("/images/placeholders") ? "" : player?.avatar || "",
    coverImage: player?.coverImage || "",
    konamiId: player?.konamiId || "",
    deviceModel: player?.deviceModel || "",
    dob: player?.dob ? String(player.dob).slice(0, 10) : "",
    preferredPosition: player?.preferredPosition || "CF",
    playStyle: player?.playStyle || "Possession Game",
    facebookProfile: player?.facebookProfile || "",
    location: player?.location || "",
    phone: player?.phone || "",
    bio: player?.bio || "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const body: any = { ...form };
      if (!body.dob) delete body.dob;
      if (!player) {
        // Staff accounts without a player profile can only change name/avatar.
        for (const k of Object.keys(body)) if (!["fullName", "avatar"].includes(k)) delete body[k];
      }
      const res = await fetch("/api/me/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Save failed");
      setMsg({ ok: true, text: "Profile saved." });
      onSaved();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5 text-xs max-w-3xl">
      {msg && <div className={`p-3 rounded-xl font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>{msg.text}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ImageInput label="Profile photo" value={form.avatar} onChange={(v) => set("avatar", v)} />
        {player && <ImageInput label="Cover image" value={form.coverImage} onChange={(v) => set("coverImage", v)} aspect="wide" />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name">
          <input className={input} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required minLength={2} maxLength={60} />
        </Field>
        {player && (
          <>
            <Field label="Konami ID / UID">
              <input className={input} value={form.konamiId} onChange={(e) => set("konamiId", e.target.value)} minLength={5} maxLength={40} />
            </Field>
            <Field label="Device">
              <input className={input} list="device-models" value={form.deviceModel} onChange={(e) => set("deviceModel", e.target.value)} maxLength={60} placeholder="e.g. Redmi Note 13 Pro" />
              <datalist id="device-models">
                {DEVICE_MODELS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </Field>
            <Field label="Date of birth">
              <input type="date" className={input} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
            </Field>
            <Field label="Location">
              <LocationInput className={input} value={form.location} onChange={(v) => set("location", v)} />
            </Field>
            <Field label="Position">
              <select className={input} value={form.preferredPosition} onChange={(e) => set("preferredPosition", e.target.value)}>
                {PLAYER_POSITIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Play style">
              <select className={input} value={form.playStyle} onChange={(e) => set("playStyle", e.target.value)}>
                {PLAY_STYLES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Facebook profile URL">
              <input className={input} value={form.facebookProfile} onChange={(e) => set("facebookProfile", e.target.value)} placeholder="https://facebook.com/…" />
            </Field>
            <Field label="Phone (only admins can see this)">
              <input className={input} value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={30} />
            </Field>
          </>
        )}
      </div>
      {player && (
        <Field label={`Bio (${form.bio.length}/300)`}>
          <textarea className={input} rows={4} maxLength={300} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
        </Field>
      )}
      <button disabled={busy} className="px-5 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-60">
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

function SecurityForm() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPassword !== confirm) {
      setMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setMsg({ ok: true, text: json.data.message });
      setCurrent("");
      setNew("");
      setConfirm("");
    } catch (e: any) {
      setMsg({ ok: false, text: e.message || "Failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-sm space-y-4 text-xs max-w-md">
      <h2 className="text-sm font-black text-black">Change password</h2>
      {msg && <div className={`p-3 rounded-xl font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>{msg.text}</div>}
      <Field label="Current password">
        <PasswordInput autoComplete="current-password" className={input} value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required />
      </Field>
      <Field label="New password (8+ chars, upper, lower, number)">
        <PasswordInput autoComplete="new-password" className={input} value={newPassword} onChange={(e) => setNew(e.target.value)} required minLength={8} />
      </Field>
      <Field label="Confirm new password">
        <PasswordInput autoComplete="new-password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </Field>
      <button disabled={busy} className="px-5 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-60">
        {busy ? "Updating…" : "Update password"}
      </button>
      <p className="text-[11px] text-slate-500">Changing your password signs you out on every other device.</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-slate-700 font-bold">{label}</span>
      {children}
    </label>
  );
}
