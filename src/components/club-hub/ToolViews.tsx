"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Hourglass, Trophy, CheckCircle2, CalendarDays, Crown, UserCog } from "lucide-react";
import { DEVICE_MODELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast, confirmDialog, infoDialog } from "@/lib/feedback";
import { ImageInput } from "@/components/ui/ImageInput";
import { LocationInput } from "@/components/ui/LocationInput";
import { CopyButton } from "@/components/ui/CopyButton";
import { useClubHub } from "./ClubHubContext";
import { GROUPS, type ClubTool } from "./tools";

const input = "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-black focus:bg-white text-sm";

export function ToolShell({ tool, children }: { tool: ClubTool; children: React.ReactNode }) {
  const g = GROUPS.find((x) => x.id === tool.group)!;
  return (
    <div className="space-y-5">
      <Link href="/dashboard/my-club" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-black">
        <ArrowLeft className="w-3.5 h-3.5" /> All tools
      </Link>
      <div className="flex items-start gap-3.5">
        <span className={`w-12 h-12 rounded-2xl ring-1 flex items-center justify-center shrink-0 ${g.tile}`}>
          <tool.icon className="w-5 h-5" />
        </span>
        <div>
          <div className={`text-[10px] font-black uppercase tracking-[0.18em] ${g.tone}`}>{g.label}</div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950">{tool.label}</h1>
          <p className="text-sm text-slate-500">{tool.desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 ${className}`}>{children}</div>
);

export function ComingSoon({ tool }: { tool: ClubTool }) {
  return (
    <Card className="text-center py-14">
      <span className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
        <Hourglass className="w-6 h-6" />
      </span>
      <h2 className="mt-4 text-lg font-black text-slate-950">{tool.label} is coming soon</h2>
      <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">This tool is being built. It will appear here for your club managers as soon as it's ready.</p>
    </Card>
  );
}

// ---------------------------------------------------------------- Squad Roster

export function SquadRoster() {
  const { club } = useClubHub();
  const squad = [...(club.squad || [])].sort((a: any, b: any) => (a.shirtNo || 999) - (b.shirtNo || 999));
  if (!squad.length) return <Card className="text-center text-sm text-slate-500 py-12">No players in your squad yet.</Card>;
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 border-b border-slate-100 text-xs font-bold text-slate-500">{squad.length} players</div>
      <div className="divide-y divide-slate-100">
        {squad.map((p: any) => (
          <div key={p.id} className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <span className="w-8 text-center text-xs font-black font-mono text-slate-400">{p.shirtNo ? `#${p.shirtNo}` : "—"}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100" />
            <div className="min-w-0 flex-1">
              <Link href={`/players/${p.username}`} className="text-sm font-bold text-slate-950 hover:underline truncate block">{p.fullName}</Link>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                <span className="font-mono truncate">UID {p.konamiId || "—"}</span>
                {p.konamiId && <CopyButton value={p.konamiId} label="UID copied" className="!w-5 !h-5 !border-0 !bg-transparent" />}
              </div>
            </div>
            <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-black">{p.preferredPosition}</span>
            <span className="hidden md:inline text-[11px] font-semibold text-emerald-700 w-28 text-right">{(p.contract?.status || "").replace(/_/g, " ").toLowerCase()}</span>
            <span className="text-xs font-black font-mono bg-slate-100 px-2 py-0.5 rounded">{p.rating}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- Update Player Info

export function UpdatePlayerInfo() {
  const { club, reload } = useClubHub();
  const squad = [...(club.squad || [])].sort((a: any, b: any) => a.fullName.localeCompare(b.fullName));
  const [selectedId, setSelectedId] = useState<string>("");
  const [q, setQ] = useState("");
  const selected = squad.find((p: any) => p.id === selectedId);
  const s = q.trim().toLowerCase();
  const shown = squad.filter((p: any) => !s || `${p.fullName} ${p.username} ${p.konamiId}`.toLowerCase().includes(s));

  const pick = (id: string) => {
    setSelectedId(id);
    // On phones the editor sits below the list.
    setTimeout(() => document.getElementById("player-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  if (!squad.length) return <Card className="text-center text-sm text-slate-500 py-12">No players in your squad yet.</Card>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-4 items-start">
      {/* Player list */}
      <Card className="!p-0 overflow-hidden">
        <div className="p-3 border-b border-slate-100">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 pb-2">Player list · {squad.length}</div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, username or UID…" className={`${input} !py-2`} />
        </div>
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
          {shown.map((p: any) => (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${p.id === selectedId ? "bg-amber-50" : "hover:bg-slate-50"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.avatar} alt="" className={`w-10 h-10 rounded-full object-cover bg-slate-100 ring-2 ${p.id === selectedId ? "ring-[#C79A3B]" : "ring-transparent"}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-950 truncate">{p.fullName}</span>
                <span className="block text-[11px] text-slate-500 font-mono truncate">{p.konamiId || "no UID"}</span>
              </span>
              <span className="text-[11px] font-black font-mono text-slate-400">{p.shirtNo ? `#${p.shirtNo}` : ""}</span>
            </button>
          ))}
          {!shown.length && <div className="p-6 text-center text-xs text-slate-500">No player matches “{q}”.</div>}
        </div>
      </Card>

      {/* Editor */}
      <div id="player-editor" className="scroll-mt-24">
        {selected ? (
          <PlayerEditor key={selected.id} player={selected} squad={squad} onSaved={reload} />
        ) : (
          <Card className="text-center py-16">
            <UserCog className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">Select a player</p>
            <p className="text-xs text-slate-500">Pick someone from the player list to update their photo, Konami ID, device or shirt number.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function PlayerEditor({ player, squad, onSaved }: { player: any; squad: any[]; onSaved: () => Promise<void> }) {
  const clean = (v?: string) => (v && !v.startsWith("/images/placeholders") ? v : "");
  const [f, setF] = useState({
    avatar: clean(player.avatar),
    konamiId: player.konamiId || "",
    deviceModel: player.deviceModel || "",
    shirtNo: player.shirtNo ? String(player.shirtNo) : "",
  });
  const [busy, setBusy] = useState(false);
  const takenBy = f.shirtNo ? squad.find((p) => p.id !== player.id && String(p.shirtNo || "") === f.shirtNo) : null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (takenBy) return toast.error(`#${f.shirtNo} is already worn by ${takenBy.fullName}`);
    setBusy(true);
    try {
      const res = await fetch(`/api/me/club/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, shirtNo: f.shirtNo ? Number(f.shirtNo) : "" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Save failed");
      await onSaved();
      toast.success(`${player.fullName} updated`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <form onSubmit={save} className="space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={player.avatar} alt="" className="w-14 h-14 rounded-full object-cover bg-slate-100" />
          <div className="min-w-0 flex-1">
            <div className="text-base font-black text-slate-950 truncate">{player.fullName}</div>
            <div className="text-xs text-slate-500 font-mono">@{player.username} · {player.preferredPosition}</div>
          </div>
          <Link href={`/players/${player.username}`} target="_blank" className="text-xs font-bold text-slate-500 hover:text-black shrink-0">
            Profile ↗
          </Link>
        </div>

        <ImageInput label="Player image" value={f.avatar} onChange={(v) => setF({ ...f, avatar: v })} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">Player new Konami User ID</span>
            <input className={`${input} font-mono`} value={f.konamiId} onChange={(e) => setF({ ...f, konamiId: e.target.value })} minLength={5} maxLength={40} placeholder="e.g. ASDL-229-704-966" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">Player new device info</span>
            <input className={input} list="club-device-models" value={f.deviceModel} onChange={(e) => setF({ ...f, deviceModel: e.target.value })} minLength={2} maxLength={60} placeholder="e.g. Redmi Note 13 Pro" />
            <datalist id="club-device-models">
              {DEVICE_MODELS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">Shirt number</span>
            <input type="number" min={1} max={99} className={`${input} font-mono`} value={f.shirtNo} onChange={(e) => setF({ ...f, shirtNo: e.target.value })} placeholder="1–99" />
            {takenBy && <span className="block text-[11px] font-semibold text-rose-600">#{f.shirtNo} is already worn by {takenBy.fullName}</span>}
          </label>
        </div>

        <div className="flex justify-end">
          <SaveButton busy={busy} />
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------- Register New Player

const EMPTY_REG = { avatar: "", email: "", fullName: "", deviceModel: "", password: "", facebookProfile: "", konamiId: "", dob: "", shirtNo: "" };

export function RegisterNewPlayer() {
  const { club, reload } = useClubHub();
  const [f, setF] = useState(EMPTY_REG);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY_REG, v: string) => setF((x) => ({ ...x, [k]: v }));
  const taken = new Set((club.squad || []).map((p: any) => p.shirtNo).filter(Boolean));
  const freeNumbers = Array.from({ length: 99 }, (_, i) => i + 1).filter((n) => !taken.has(n));
  const pwOk = f.password.length >= 8 && /[a-z]/.test(f.password) && /[A-Z]/.test(f.password) && /[0-9]/.test(f.password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.avatar) return toast.error("Please upload the player's photo");
    if (!pwOk) return toast.error("Password needs 8+ characters with uppercase, lowercase and a number");
    setBusy(true);
    try {
      const res = await fetch("/api/me/club/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Registration failed");
      await reload();
      setF(EMPTY_REG);
      const esc = (s: string) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
      await infoDialog({
        icon: "success",
        title: `${esc(json.data.fullName)} joined ${esc(club.name)}`,
        html: `The player can sign in with<br/><b>${esc(json.data.email)}</b> or username <b>@${esc(json.data.username)}</b><br/>and the password you set. They can change it from their dashboard.`,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (club.status !== "ACTIVE") {
    return <Card className="text-center text-sm text-slate-500 py-12">Your club must be approved by an admin before you can register players.</Card>;
  }

  const label = (text: string, required = true) => (
    <span className="text-xs font-bold text-slate-700">
      {text} {required ? <span className="text-rose-500">*</span> : <span className="font-normal text-slate-400">(optional)</span>}
    </span>
  );

  return (
    <Card>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <h2 className="text-base font-black text-slate-950">Register player — {club.name}</h2>
          <p className="text-xs text-slate-500">Creates a full player account in your club. The player signs in with the email and password below, like any other player.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 space-y-1">
          {label("Player photo")}
          <p className="text-[11px] text-slate-500 pb-2">Upload a clear face photo. Fake or masked photos will be rejected.</p>
          <ImageInput label="" value={f.avatar} onChange={(v) => set("avatar", v)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="block space-y-1">
            {label("Player email")}
            <input type="email" required className={input} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="Personal email address" autoComplete="off" />
          </label>
          <label className="block space-y-1">
            {label("Full name")}
            <input required minLength={2} maxLength={60} className={input} value={f.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Name as on Facebook" />
          </label>
          <label className="block space-y-1">
            {label("Device model")}
            <input required minLength={2} maxLength={60} list="reg-device-models" className={input} value={f.deviceModel} onChange={(e) => set("deviceModel", e.target.value)} placeholder="e.g. Poco X3 Pro" />
            <datalist id="reg-device-models">
              {DEVICE_MODELS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </label>
          <label className="block space-y-1">
            {label("Password")}
            <input type="password" required className={input} value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="8+ chars, Aa + number" autoComplete="new-password" />
            {f.password && !pwOk && <span className="block text-[11px] text-rose-600">Use 8+ characters with uppercase, lowercase and a number.</span>}
          </label>
          <label className="block space-y-1">
            {label("Facebook URL")}
            <input type="url" required className={input} value={f.facebookProfile} onChange={(e) => set("facebookProfile", e.target.value)} placeholder="https://www.facebook.com/…" />
          </label>
          <label className="block space-y-1">
            {label("Konami UID", false)}
            <input className={`${input} font-mono`} value={f.konamiId} onChange={(e) => set("konamiId", e.target.value)} placeholder="e.g. ASDL-229-704-966" />
          </label>
          <label className="block space-y-1">
            {label("Shirt number")}
            <select required className={input} value={f.shirtNo} onChange={(e) => set("shirtNo", e.target.value)}>
              <option value="">Select a number</option>
              {freeNumbers.map((n) => (
                <option key={n} value={n}>
                  #{n}
                </option>
              ))}
            </select>
            <span className="block text-[11px] text-slate-400">Numbers already worn in your squad are hidden.</span>
          </label>
          <label className="block space-y-1">
            {label("Date of birth", false)}
            <input type="date" className={input} value={f.dob} onChange={(e) => set("dob", e.target.value)} />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Registering for: <b className="text-slate-900">{club.name}</b>
          </p>
          <button disabled={busy} className="px-6 py-3 rounded-xl bg-black text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-60">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Register player
          </button>
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------- Fixtures

export function ClubFixtures() {
  const { club } = useClubHub();
  const list = club.fixtures || [];
  if (!list.length) return <Card className="text-center text-sm text-slate-500 py-12">No fixtures yet. They appear once your club is drawn in a tournament.</Card>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {list.map((f: any) => (
        <Link key={f.id} href={`/matches/${f.id}`} className="rounded-2xl bg-white border border-slate-200 hover:border-black p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-950 truncate">
              {f.homeClub?.name || f.homePlayer?.fullName} vs {f.awayClub?.name || f.awayPlayer?.fullName}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> {formatDate(f.scheduledDate)}
              {f.tournamentName ? ` · ${f.tournamentName}` : ""}
            </div>
          </div>
          <span className={`text-xs font-black font-mono px-2 py-1 rounded-lg ${f.status === "LIVE" ? "bg-rose-600 text-white" : "bg-slate-100"}`}>
            {f.result ? `${f.result.homeScore} - ${f.result.awayScore}` : f.status}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Transfer History

export function TransferHistory() {
  const { club } = useClubHub();
  const offers = club.offers || [];
  if (!offers.length) return <Card className="text-center text-sm text-slate-500 py-12">No transfer offers yet. Make offers from the Transfer Market.</Card>;
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {offers.map((o: any) => (
          <div key={o.id} className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 text-sm">
            <span className="font-bold truncate">{o.player?.fullName}</span>
            <span className="font-mono">{formatCurrency(o.offeredFee)}</span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${o.status === "PENDING" ? "bg-amber-50 text-amber-800" : o.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
              {o.status}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- Change Info / Logo

async function patchClub(body: any) {
  const res = await fetch("/api/me/club", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Save failed");
}

export function ChangeInfo() {
  const { club, reload } = useClubHub();
  const [f, setF] = useState({ slogan: club.slogan || "", location: club.location || "", facebookPage: club.facebookPage || "", description: club.description || "" });
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await patchClub(f);
      await reload();
      toast.success("Club info saved");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">Slogan</span>
            <input className={input} value={f.slogan} onChange={(e) => setF({ ...f, slogan: e.target.value })} maxLength={120} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">Location</span>
            <LocationInput className={input} value={f.location} onChange={(v) => setF({ ...f, location: v })} />
          </label>
          <label className="sm:col-span-2 block space-y-1">
            <span className="text-xs font-bold text-slate-700">Facebook page</span>
            <input className={input} value={f.facebookPage} onChange={(e) => setF({ ...f, facebookPage: e.target.value })} placeholder="https://facebook.com/…" />
          </label>
          <label className="sm:col-span-2 block space-y-1">
            <span className="text-xs font-bold text-slate-700">About the club</span>
            <textarea className={input} rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={1000} />
          </label>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">Club name and tag can only be changed by an admin.</p>
          <SaveButton busy={busy} />
        </div>
      </form>
    </Card>
  );
}

export function ChangeLogo() {
  const { club, reload } = useClubHub();
  const clean = (v?: string) => (v && !v.startsWith("/images/placeholders") && !v.startsWith("/api/crest/") ? v : "");
  const [f, setF] = useState({ logo: clean(club.logo), banner: clean(club.banner) });
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await patchClub(f);
      await reload();
      toast.success("Branding saved");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ImageInput label="Club logo" value={f.logo} onChange={(v) => setF({ ...f, logo: v })} />
          <ImageInput label="Cover / poster" value={f.banner} onChange={(v) => setF({ ...f, banner: v })} aspect="wide" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">Without a logo your club shows an automatic crest with its tag.</p>
          <SaveButton busy={busy} />
        </div>
      </form>
    </Card>
  );
}

const SaveButton = ({ busy }: { busy: boolean }) => (
  <button disabled={busy} className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-60 shrink-0">
    {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save changes
  </button>
);

// ---------------------------------------------------------------- Access Control

export function AccessControl() {
  const { club } = useClubHub();
  const isMain = club.access === "MANAGER";
  const candidates = (club.squad || []).filter((p: any) => p.userId);
  const [playerId, setPlayerId] = useState("");
  const [busy, setBusy] = useState(false);

  const handOver = async () => {
    const p = candidates.find((c: any) => c.id === playerId);
    if (!p) return;
    const yes = await confirmDialog({
      title: `Make ${p.fullName} the main manager?`,
      text: `${p.fullName} will manage ${club.name} from their own account. You will lose main-manager access.`,
      confirmText: "Hand over",
      danger: true,
    });
    if (!yes) return;
    setBusy(true);
    try {
      const res = await fetch("/api/me/club/hand-over", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Could not hand over the club");
      toast.success(`${p.fullName} is now the main manager`);
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast.error(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Main manager</div>
        <div className="mt-1 text-lg font-black text-slate-950">{club.managerName || "—"}</div>
        <p className="text-xs text-slate-500">The main manager registers the club for tournaments and can hand the club over.</p>
      </Card>

      {isMain ? (
        <Card className="!bg-amber-50/60 !border-amber-200 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#C79A3B] text-black flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-950">Hand over the club</h2>
              <p className="text-xs text-slate-600 mt-0.5">Give the main-manager role to a player in your squad. They manage the club from their own player login.</p>
            </div>
          </div>
          {candidates.length ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className={`${input} !bg-white flex-1`}>
                <option value="">Choose a squad player…</option>
                {candidates.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} (@{p.username})
                  </option>
                ))}
              </select>
              <button onClick={handOver} disabled={!playerId || busy} className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50">
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Hand over club
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No squad player with an account yet.</p>
          )}
        </Card>
      ) : (
        <Card className="text-sm text-slate-600">Only the main manager can hand the club over.</Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Tournament Registration

export function TournamentRegistration() {
  const { club } = useClubHub();
  const isMain = club.access === "MANAGER";
  const [list, setList] = useState<any[] | null>(null);
  const [busy, setBusy] = useState("");

  const load = async () => {
    const res = await fetch("/api/tournaments", { cache: "no-store" });
    const json = await res.json();
    const all = json.success ? json.data : [];
    setList(all.filter((t: any) => t.isRegistrationOpen || (t.participantClubIds || []).includes(club.id)));
  };

  useEffect(() => {
    load().catch(() => setList([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club.id]);

  const act = async (t: any, entered: boolean) => {
    const yes = await confirmDialog({
      title: entered ? `Withdraw ${club.name} from ${t.name}?` : `Register ${club.name} for ${t.name}?`,
      text: entered ? "You can register again while registration is open." : undefined,
      confirmText: entered ? "Withdraw" : "Register club",
      danger: entered,
    });
    if (!yes) return;
    setBusy(t.id);
    try {
      const res = await fetch(`/api/tournaments/${t.slug}/join`, { method: entered ? "DELETE" : "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Request failed");
      toast.success(entered ? "Registration withdrawn" : `${club.name} is registered!`);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };

  if (list === null) return <Card className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></Card>;

  return (
    <div className="space-y-3">
      {!isMain && <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">Only the club's main manager can register or withdraw the club.</div>}
      {!list.length && <Card className="text-center text-sm text-slate-500 py-12">No tournaments are open for registration right now.</Card>}
      {list.map((t) => {
        const entered = (t.participantClubIds || []).includes(club.id);
        return (
          <div key={t.id} className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.logo} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0" />
              <div className="min-w-0">
                <Link href={`/tournaments/${t.slug}`} className="text-sm font-black text-slate-950 hover:underline truncate block">{t.name}</Link>
                <div className="text-[11px] text-slate-500">
                  {t.currentParticipants}/{t.maxParticipants} clubs
                  {t.registrationDeadline ? ` · closes ${formatDate(t.registrationDeadline)}` : ""}
                  {t.prizePool ? ` · ${t.prizePool}` : ""}
                </div>
              </div>
            </div>
            {entered ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                </span>
                {isMain && t.status === "REGISTRATION_OPEN" && (
                  <button onClick={() => act(t, true)} disabled={busy === t.id} className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                    Withdraw
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => act(t, false)}
                disabled={!isMain || busy === t.id}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {busy === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />} Register club
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
