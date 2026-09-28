"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, BadgeCheck, Pencil, Loader2, ExternalLink, Tag } from "lucide-react";
import { api, Badge, Button, Empty, Field, inputCls, Modal, Notice, PageHeader, statusTone, Toggle } from "@/components/admin/ui";
import { ImageInput } from "@/components/ui/ImageInput";
import { formatCurrency } from "@/lib/utils";
import { PLAYER_POSITIONS } from "@/lib/constants";

const STATUSES = ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "BANNED", "INACTIVE"];

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [me, setMe] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        fetch(`/api/players?search=${encodeURIComponent(search)}&status=ALL`, { cache: "no-store" }).then((r) => r.json()),
        api<any[]>("/api/clubs"),
      ]);
      setPlayers(p.data || []);
      setClubs(c);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((j) => j.success && setMe(j.data));
  }, []);

  const isAdmin = me?.role === "ADMIN" || me?.role === "SUPER_ADMIN";

  const patch = async (p: any, body: any, label: string) => {
    setMsg(null);
    try {
      await api(`/api/admin/players/${p.id}`, { method: "PATCH", json: body });
      setMsg({ ok: true, text: `${p.fullName}: ${label}` });
      load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  };

  const listForTransfer = async (p: any) => {
    const price = prompt(`Asking price for ${p.fullName} in $M`, String(p.marketValue));
    if (!price) return;
    try {
      await api("/api/admin/transfers", { method: "POST", json: { action: "LIST", playerId: p.id, askingPrice: Number(price) } });
      setMsg({ ok: true, text: `${p.fullName} is now on the transfer list.` });
      load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Players" subtitle="Verify players, set their club, adjust ratings and manage status. Player accounts are created when people sign up." />

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input className={`${inputCls} pl-9`} placeholder="Search name, username, Konami ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" />
        </div>
      ) : players.length === 0 ? (
        <Empty>No players yet. They appear here when people register.</Empty>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">Club</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Record</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {players.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 min-w-[220px]">
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.avatar} alt="" className="w-9 h-9 rounded-lg object-cover" />
                        <div>
                          <div className="font-bold text-slate-950 flex items-center gap-1">
                            {p.fullName} {p.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-sky-600" />}
                          </div>
                          <div className="text-slate-500">@{p.username} · {p.preferredPosition} · UID {p.konamiId || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white max-w-[160px] disabled:opacity-60"
                        value={p.club?.id || ""}
                        disabled={!isAdmin}
                        onChange={(e) => patch(p, { clubId: e.target.value }, e.target.value ? "club updated" : "released to free agency")}
                      >
                        <option value="">Free agent</option>
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{p.rating}</td>
                    <td className="py-2.5 px-3 font-mono">{formatCurrency(p.marketValue)}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {p.stats.wins}-{p.stats.draws}-{p.stats.losses}
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        className={`px-2 py-1 rounded-lg border text-[11px] font-bold bg-white ${statusTone(p.status) === "red" ? "text-rose-700 border-rose-200" : "border-slate-200"}`}
                        value={p.status}
                        onChange={(e) => patch(p, { status: e.target.value }, `status → ${e.target.value}`)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex justify-end gap-1.5">
                        <Button small variant={p.isVerified ? "secondary" : "success"} onClick={() => patch(p, { isVerified: !p.isVerified }, p.isVerified ? "unverified" : "verified")}>
                          <BadgeCheck className="w-3.5 h-3.5" /> {p.isVerified ? "Unverify" : "Verify"}
                        </Button>
                        {isAdmin && (
                          <Button small variant="secondary" onClick={() => listForTransfer(p)} title="List on transfer market">
                            <Tag className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button small variant="secondary" onClick={() => setEditing(p)} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Link href={`/players/${p.username}`} target="_blank" className="inline-flex items-center px-2 py-1.5 text-slate-500 hover:text-black" title="Public profile">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && <EditPlayerModal player={editing} isAdmin={isAdmin} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}

function EditPlayerModal({ player, isAdmin, onClose, onSaved }: { player: any; isAdmin: boolean; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    fullName: player.fullName,
    avatar: player.avatar?.startsWith("/images/placeholders") ? "" : player.avatar,
    konamiId: player.konamiId,
    deviceModel: player.deviceModel,
    preferredPosition: player.preferredPosition,
    bio: player.bio || "",
    rating: String(player.rating),
    marketValue: String(player.marketValue),
    isVerified: !!player.isVerified,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const body: any = { ...f };
      if (!isAdmin) {
        delete body.rating;
        delete body.marketValue;
      } else {
        body.rating = Number(f.rating);
        body.marketValue = Number(f.marketValue);
      }
      await api(`/api/admin/players/${player.id}`, { method: "PATCH", json: body });
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${player.fullName}`} wide>
      <form onSubmit={save} className="space-y-3">
        {err && <Notice kind="err">{err}</Notice>}
        <ImageInput label="Photo" value={f.avatar} onChange={(v) => setF({ ...f, avatar: v })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full name">
            <input className={inputCls} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
          </Field>
          <Field label="Konami ID">
            <input className={inputCls} value={f.konamiId} onChange={(e) => setF({ ...f, konamiId: e.target.value })} />
          </Field>
          <Field label="Device">
            <input className={inputCls} value={f.deviceModel} onChange={(e) => setF({ ...f, deviceModel: e.target.value })} />
          </Field>
          <Field label="Position">
            <select className={inputCls} value={f.preferredPosition} onChange={(e) => setF({ ...f, preferredPosition: e.target.value })}>
              {PLAYER_POSITIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          {isAdmin && (
            <>
              <Field label="Rating" hint="Normally updated automatically from results">
                <input type="number" className={inputCls} value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })} />
              </Field>
              <Field label="Market value ($M)">
                <input type="number" step="0.1" className={inputCls} value={f.marketValue} onChange={(e) => setF({ ...f, marketValue: e.target.value })} />
              </Field>
            </>
          )}
          <Field label="Bio" full>
            <textarea className={inputCls} rows={3} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} maxLength={300} />
          </Field>
          <Toggle checked={f.isVerified} onChange={(v) => setF({ ...f, isVerified: v })} label="Verified player" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
