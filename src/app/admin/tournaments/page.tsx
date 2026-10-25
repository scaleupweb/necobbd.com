"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Crown, Trophy, Download, Swords, UserMinus, UserPlus, ExternalLink, Check, X, Copy } from "lucide-react";
import { ResourceManager, FieldDef } from "@/components/admin/ResourceManager";
import { api, Badge, Button, Empty, Modal, Notice, statusTone } from "@/components/admin/ui";
import { toast, confirmDialog } from "@/lib/feedback";
import { formatDate } from "@/lib/utils";

const STATUSES = ["DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING", "COMPLETED", "CANCELLED"];
const FORMATS = ["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "LEAGUE_ROUND_ROBIN", "GROUP_AND_KNOCKOUT", "SWISS", "CLUB_BATTLE", "NATIONAL_TOURNAMENT"];
const opt = (a: string[]) => a.map((v) => ({ value: v, label: v.replace(/_/g, " ") }));

const FIELDS: FieldDef[] = [
  { name: "name", label: "Tournament name", type: "text", required: true },
  { name: "season", label: "Season / edition", type: "text", placeholder: "e.g. Season 1" },
  { name: "status", label: "Status", type: "select", options: opt(STATUSES), required: true, default: "DRAFT", hint: "DRAFT is hidden from the public site" },
  { name: "format", label: "Format", type: "select", options: opt(FORMATS), required: true, default: "SINGLE_ELIMINATION" },
  { name: "maxParticipants", label: "Max clubs", type: "number", required: true, default: 32, hint: "Only club main managers can register their club" },
  { name: "prizePool", label: "Prize pool", type: "text", placeholder: "e.g. 50,000 BDT" },
  { name: "entryFee", label: "Entry fee", type: "text", default: "Free" },
  { name: "gameCategory", label: "Game", type: "text", default: "eFootball Mobile" },
  { name: "platform", label: "Platform", type: "text", default: "Mobile" },
  { name: "registrationDeadline", label: "Registration deadline", type: "datetime" },
  { name: "startDate", label: "Start date", type: "datetime" },
  { name: "endDate", label: "End date", type: "datetime" },
  { name: "isFeatured", label: "Feature on homepage", type: "checkbox" },
  { name: "logo", label: "Logo", type: "image" },
  { name: "banner", label: "Banner", type: "wideImage" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "rules", label: "Tournament rules", type: "textarea", hint: "Shown on the tournament page. Leave empty to link the general rulebook." },
];

export default function AdminTournamentsPage() {
  const [participantsOf, setParticipantsOf] = useState<any>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const quickStatus = async (row: any, status: string, reload: () => void) => {
    try {
      await api(`/api/admin/resources/tournaments/${row.id}`, { method: "PATCH", json: { status } });
      toast.success(`${row.name}: ${status.replace(/_/g, " ").toLowerCase()}`);
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <ResourceManager
        resource="tournaments"
        title="Tournaments"
        singular="tournament"
        subtitle="Create tournaments, open or close registration, manage participants and crown champions."
        fields={FIELDS}
        reloadKey={reloadKey}
        columns={[
          {
            label: "Tournament",
            render: (r) => (
              <div className="flex items-center gap-2.5 min-w-[200px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.logo || "/images/placeholders/club.svg"} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                <div>
                  <div className="font-bold text-slate-950">{r.name}</div>
                  <div className="text-[10px] text-slate-500">{r.format.replace(/_/g, " ")}{r.isFeatured ? " · ★ featured" : ""}</div>
                </div>
              </div>
            ),
          },
          {
            label: "Status",
            render: (r) => (
              <select
                value={r.status}
                onChange={(e) => quickStatus(r, e.target.value, () => setReloadKey((k) => k + 1))}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border bg-white`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            ),
          },
          { label: "Players", render: (r) => <span className="font-mono">{r.currentParticipants ?? 0}/{r.maxParticipants}</span> },
          { label: "Deadline", render: (r) => (r.registrationDeadline ? formatDate(r.registrationDeadline) : "—") },
          { label: "Starts", render: (r) => (r.startDate ? formatDate(r.startDate) : "—") },
        ]}
        rowActions={(r) => (
          <>
            <Button small variant="secondary" onClick={() => setParticipantsOf(r)} title="Participants">
              <Users className="w-3.5 h-3.5" /> Players
            </Button>
            <Link href={`/admin/tournaments/${r.id}/competition`} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-black text-white hover:bg-zinc-800" title="Groups, fixtures, tables and knockout">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Competition
            </Link>
            <Link href={`/admin/fixtures?tournament=${r.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 bg-white hover:border-black">
              <Swords className="w-3.5 h-3.5" /> Fixtures
            </Link>
            <Link href={`/tournaments/${r.slug}`} target="_blank" className="inline-flex items-center px-2 py-1.5 rounded-xl text-slate-500 hover:text-black" title="Open public page">
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
      />
      {participantsOf && <ParticipantsModal tournament={participantsOf} onClose={() => setParticipantsOf(null)} onChanged={() => setReloadKey((k) => k + 1)} />}
    </>
  );
}

function ParticipantsModal({ tournament, onClose, onChanged }: { tournament: any; onClose: () => void; onChanged: () => void }) {
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [winner, setWinner] = useState<string>(tournament.winnerPlayerId || "");
  const [view, setView] = useState<"ALL" | "PENDING" | "APPROVED" | "REMOVED">("ALL");
  const [q, setQ] = useState("");
  const [bulk, setBulk] = useState(false);

  useEffect(() => {
    api<any[]>(`/api/admin/tournaments/${tournament.id}/participants`).then(setList).catch((e) => setError(e.message));
  }, [tournament.id]);

  const isClub = tournament.participantType === "CLUB";
  const act = async (id: string, action: "REMOVE" | "RESTORE" | "APPROVE" | "REJECT") => {
    if (action === "REMOVE" && !(await confirmDialog({ title: `Remove this ${isClub ? "club" : "player"} from the tournament?`, text: "You can restore them later.", confirmText: "Remove", danger: true }))) return;
    if (action === "REJECT" && !(await confirmDialog({ title: "Reject this club's registration?", text: "The club manager will be notified.", confirmText: "Reject", danger: true }))) return;
    try {
      setList(await api(`/api/admin/tournaments/${tournament.id}/participants`, { method: "PATCH", json: { ...(isClub ? { clubId: id } : { userId: id }), action } }));
      toast.success({ REMOVE: "Removed from tournament", RESTORE: "Restored", APPROVE: "Registration approved", REJECT: "Registration rejected" }[action]);
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const crown = async (playerId: string) => {
    try {
      await api(`/api/admin/resources/tournaments/${tournament.id}`, { method: "PATCH", json: { winnerPlayerId: playerId, ...(playerId ? { status: "COMPLETED" } : {}) } });
      setWinner(playerId);
      onChanged();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const exportCsv = () => {
    if (!list) return;
    const rows = isClub
      ? [["Club", "Tag", "Manager", "Email", "Payment", "Facebook post", "Joined", "Status"]]
      : [["Name", "Username", "Email", "Konami ID", "Phone", "Rating", "Joined", "Status"]];
    for (const p of list)
      rows.push(
        isClub
          ? [p.fullName, p.username, p.managerName || "", p.email || "", p.paymentType || "", p.fbPostLink || "", p.joinedAt, p.status]
          : [p.fullName, p.username, p.email, p.konamiId || "", p.phone || "", String(p.rating ?? ""), p.joinedAt, p.status]
      );
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tournament.slug}-participants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const active = (list || []).filter((p) => p.status !== "REMOVED");
  const pendingCount = active.filter((p) => p.status === "PENDING").length;
  const kindOf = (p: any) => (p.status === "REMOVED" ? "REMOVED" : p.status === "PENDING" ? "PENDING" : "APPROVED");
  const counts = { ALL: (list || []).length, PENDING: pendingCount, APPROVED: active.length - pendingCount, REMOVED: (list || []).length - active.length };
  // Pending first (they need action), then approved, removed last.
  const rank = { PENDING: 0, APPROVED: 1, REMOVED: 2 } as const;
  const needle = q.trim().toLowerCase();
  const shown = (list || [])
    .filter((p) => view === "ALL" || kindOf(p) === view)
    .filter((p) => !needle || [p.fullName, p.username, p.managerName, p.email].some((v) => String(v || "").toLowerCase().includes(needle)))
    .sort((a, b) => rank[kindOf(a)] - rank[kindOf(b)]);

  const approveAll = async () => {
    const pend = active.filter((p) => p.status === "PENDING");
    if (!pend.length) return;
    if (!(await confirmDialog({ title: `Approve all ${pend.length} waiting club${pend.length === 1 ? "" : "s"}?`, text: "Each club manager is notified.", confirmText: "Approve all" }))) return;
    setBulk(true);
    let done = 0;
    try {
      for (const p of pend) {
        setList(await api(`/api/admin/tournaments/${tournament.id}/participants`, { method: "PATCH", json: { clubId: p.clubId, action: "APPROVE" } }));
        done++;
      }
      toast.success(`${done} club${done === 1 ? "" : "s"} approved`);
    } catch (e: any) {
      toast.error(`${done} approved, then: ${e.message}`);
    } finally {
      setBulk(false);
      onChanged();
    }
  };

  /** A numbered plain-text list to paste into Facebook / Messenger (no emails). */
  const copyList = async () => {
    const line = (p: any, i: number) =>
      isClub ? `${i + 1}. ${p.fullName}${p.username ? ` (${p.username})` : ""}${p.managerName ? ` — ${p.managerName}` : ""}` : `${i + 1}. ${p.fullName} (@${p.username})`;
    const approved = active.filter((p) => p.status !== "PENDING");
    const pending = active.filter((p) => p.status === "PENDING");
    const unit = isClub ? "clubs" : "players";
    const parts = [`${tournament.name} — registered ${unit} (${approved.length}/${tournament.maxParticipants})`, "", ...approved.map(line)];
    if (pending.length) parts.push("", `Waiting for approval (${pending.length}):`, ...pending.map(line));
    const text = parts.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers / no permission: fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast.success(`Copied ${approved.length} ${unit}${pending.length ? ` + ${pending.length} waiting` : ""}`);
  };

  return (
    <Modal open onClose={onClose} title={`${tournament.name} — participants`} wide>
      <div className="space-y-3">
        {error && <Notice kind="err">{error}</Notice>}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-600">
            <strong>{active.length}</strong> / {tournament.maxParticipants} registered
            {pendingCount > 0 && <span className="ml-2 font-bold text-amber-700">· {pendingCount} waiting for approval</span>}
          </div>
          <div className="flex gap-1.5">
            <Button small onClick={copyList} disabled={!active.length}>
              <Copy className="w-3.5 h-3.5" /> Copy list
            </Button>
            <Button small variant="secondary" onClick={exportCsv} disabled={!list?.length}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
        </div>
        {list !== null && list.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex gap-1 p-1 rounded-xl bg-slate-100 overflow-x-auto">
              {(
                [
                  ["ALL", "All", "bg-black text-white"],
                  ["PENDING", "Pending", "bg-amber-500 text-black"],
                  ["APPROVED", "Approved", "bg-emerald-600 text-white"],
                  ["REMOVED", "Removed", "bg-slate-500 text-white"],
                ] as const
              ).map(([k, label, on]) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-colors ${view === k ? on : "text-slate-600 hover:bg-white"}`}
                >
                  {k === "PENDING" && counts.PENDING > 0 && view !== k && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                  {label}
                  <span className={`px-1.5 rounded-md text-[10px] ${view === k ? "bg-white/25" : "bg-white text-slate-500"}`}>{counts[k]}</span>
                </button>
              ))}
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search club, manager…" className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-black" />
          </div>
        )}
        {isClub && pendingCount > 0 && (view === "ALL" || view === "PENDING") && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-xs font-bold text-amber-900">
              {pendingCount} club{pendingCount === 1 ? " is" : "s are"} waiting. Check the Facebook post, then approve.
            </span>
            <Button small variant="success" onClick={approveAll} disabled={bulk}>
              <Check className="w-3.5 h-3.5" /> {bulk ? "Approving…" : "Approve all"}
            </Button>
          </div>
        )}
        {list === null ? (
          <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading…</div>
        ) : list.length === 0 ? (
          <Empty>No one has joined yet.</Empty>
        ) : shown.length === 0 ? (
          <Empty>{needle ? "No match for that search." : view === "PENDING" ? "No one is waiting for approval. 🎉" : "Nothing here."}</Empty>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {shown.map((p) => (
              <div key={p.userId || p.clubId} className={`flex items-center gap-3 p-3 text-xs ${p.status === "REMOVED" ? "opacity-50" : p.status === "PENDING" ? "bg-amber-50/60 border-l-4 border-l-amber-400" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-950 truncate">
                    {p.fullName} {winner && winner === p.playerId && <Badge tone="amber">CHAMPION</Badge>}
                  </div>
                  <div className="text-slate-500 truncate">
                    {isClub ? `${p.username} · ${p.managerName || "no manager"} · ${p.email || "—"}` : `@${p.username} · ${p.email} · UID ${p.konamiId || "—"}`}
                  </div>
                </div>
{p.fbPostLink && (
                  <a href={p.fbPostLink} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" /> Facebook post
                  </a>
                )}
                <Badge tone={statusTone(p.status === "REMOVED" ? "REVOKED" : p.status === "PENDING" ? "PENDING" : "ACTIVE")}>{p.status === "CONFIRMED" && isClub ? "APPROVED" : p.status}</Badge>
                {p.status === "PENDING" ? (
                  <>
                    <Button small variant="success" onClick={() => act(p.clubId, "APPROVE")} title="Approve">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button small variant="ghost" onClick={() => act(p.clubId, "REJECT")} title="Reject">
                      <X className="w-3.5 h-3.5 text-rose-600" />
                    </Button>
                  </>
                ) : p.status === "REMOVED" ? (
                  <Button small variant="secondary" onClick={() => act(isClub ? p.clubId : p.userId, "RESTORE")} title="Restore">
                    <UserPlus className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <>
                    {p.playerId && (
                      <Button small variant="secondary" onClick={() => crown(winner === p.playerId ? "" : p.playerId)} title={winner === p.playerId ? "Remove champion" : "Crown champion"}>
                        <Crown className={`w-3.5 h-3.5 ${winner === p.playerId ? "text-amber-600" : ""}`} />
                      </Button>
                    )}
                    <Button small variant="ghost" onClick={() => act(isClub ? p.clubId : p.userId, "REMOVE")} title="Remove">
                      <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
