"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, KeyRound, Trash2, Loader2, ExternalLink } from "lucide-react";
import { api, Badge, Button, Empty, Field, inputCls, Modal, Notice, PageHeader, statusTone, Toggle } from "@/components/admin/ui";
import { toast, confirmDialog, infoDialog, DELETE_CONFIRM_WORD } from "@/lib/feedback";
import { formatDate } from "@/lib/utils";

const ROLES = ["PLAYER", "CLUB_MANAGER", "REFEREE", "SENIOR_REFEREE", "TOURNAMENT_OFFICIAL", "MODERATOR", "ADMIN", "SUPER_ADMIN"];
const STATUSES = ["ACTIVE", "PENDING", "SUSPENDED", "BANNED", "INACTIVE"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ search, role, status });
    try {
      setUsers(await api(`/api/admin/users?${qs}`));
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setLoading(false);
    }
  }, [search, role, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((j) => j.success && setMe(j.data));
  }, []);

  const patch = async (u: any, body: any, label: string) => {
    setMsg(null);
    try {
      await api(`/api/admin/users/${u.id}`, { method: "PATCH", json: body });
      toast.success(`${u.fullName}: ${label}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
      load();
    }
  };

  const resetPassword = async (u: any) => {
    const ok = await confirmDialog({
      title: `Reset password for ${u.fullName}?`,
      text: "A new temporary password will be generated and they will be signed out everywhere.",
      confirmText: "Reset password",
      danger: true,
    });
    if (!ok) return;
    try {
      const r = await api<{ temporaryPassword: string }>(`/api/admin/users/${u.id}`, { method: "PATCH", json: { action: "RESET_PASSWORD" } });
      await infoDialog({
        icon: "success",
        title: "Temporary password",
        html: `<div style="font-family:monospace;font-size:18px;font-weight:800;padding:10px;background:#F1F5F9;border-radius:12px;user-select:all">${r.temporaryPassword}</div><p style="margin-top:10px;font-size:12px">Share it privately with @${u.username}. They should change it after signing in.</p>`,
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (u: any) => {
    const ok = await confirmDialog({
      title: `Delete ${u.fullName}?`,
      text: `@${u.username} and their player profile will be permanently deleted. This cannot be undone.`,
      confirmText: "Delete permanently",
      danger: true,
      typeToConfirm: DELETE_CONFIRM_WORD,
    });
    if (!ok) return;
    try {
      await api(`/api/admin/users/${u.id}`, { method: "DELETE" });
      toast.success(`Deleted @${u.username}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const isSuper = me?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users & Roles"
        subtitle="Every account on the platform. Change roles, suspend or ban accounts, and reset passwords."
        actions={
          <Button onClick={() => setCreating(true)}>
            <UserPlus className="w-4 h-4" /> Create user
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${inputCls} pl-9`} placeholder="Search name, username, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={`${inputCls} sm:w-48`} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="ALL">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select className={`${inputCls} sm:w-40`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" />
        </div>
      ) : users.length === 0 ? (
        <Empty>No users found.</Empty>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Club</th>
                  <th className="py-2.5 px-3">Joined / last login</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const self = u.id === me?.id;
                  const locked = !isSuper && ["SUPER_ADMIN", "ADMIN"].includes(u.role) && !self;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 min-w-[220px]">
                        <div className="font-bold text-slate-950">
                          {u.fullName} {self && <Badge tone="blue">YOU</Badge>}
                        </div>
                        <div className="text-slate-500">
                          @{u.username} · {u.email}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-bold bg-white disabled:opacity-50"
                          value={u.role}
                          disabled={self || locked}
                          onChange={(e) => patch(u, { role: e.target.value }, `role → ${e.target.value}`)}
                        >
                          {ROLES.filter((r) => isSuper || !["SUPER_ADMIN", "ADMIN"].includes(r) || r === u.role).map((r) => (
                            <option key={r} value={r}>
                              {r.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          className={`px-2 py-1 rounded-lg border text-[11px] font-bold bg-white disabled:opacity-50 ${statusTone(u.status) === "red" ? "text-rose-700 border-rose-200" : "border-slate-200"}`}
                          value={u.status}
                          disabled={self || locked}
                          onChange={(e) => patch(u, { status: e.target.value }, `status → ${e.target.value}`)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3">{u.club?.name || <span className="text-slate-400">—</span>}</td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {formatDate(u.createdAt)}
                        <div className="text-[10px]">{u.lastLoginAt ? `last login ${formatDate(u.lastLoginAt)}` : "never logged in"}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex justify-end gap-1.5">
                          <Link href={`/players/${u.username}`} target="_blank" className="inline-flex items-center px-2 py-1.5 text-slate-500 hover:text-black" title="Public profile">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Button small variant="secondary" onClick={() => resetPassword(u)} disabled={locked} title="Reset password">
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>
                          <Button small variant="ghost" onClick={() => remove(u)} disabled={self || locked} title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateUserModal open={creating} onClose={() => setCreating(false)} onCreated={load} isSuper={isSuper} />
    </div>
  );
}

function CreateUserModal({ open, onClose, onCreated, isSuper }: { open: boolean; onClose: () => void; onCreated: () => void; isSuper: boolean }) {
  const [f, setF] = useState({ fullName: "", username: "", email: "", password: "", role: "PLAYER", createPlayerProfile: true, konamiId: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/admin/users", { method: "POST", json: f });
      setF({ fullName: "", username: "", email: "", password: "", role: "PLAYER", createPlayerProfile: true, konamiId: "" });
      onCreated();
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create user">
      <form onSubmit={submit} className="space-y-3">
        {err && <Notice kind="err">{err}</Notice>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full name *">
            <input className={inputCls} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} required />
          </Field>
          <Field label="Username *">
            <input className={inputCls} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase() })} required />
          </Field>
          <Field label="Email *" full>
            <input type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
          </Field>
          <Field label="Password *" hint="8+ chars, upper, lower, number">
            <input type="text" className={inputCls} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required autoComplete="off" />
          </Field>
          <Field label="Role *">
            <select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              {ROLES.filter((r) => isSuper || !["SUPER_ADMIN", "ADMIN"].includes(r)).map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Toggle checked={f.createPlayerProfile} onChange={(v) => setF({ ...f, createPlayerProfile: v })} label="Also create a player profile" />
          </div>
          {f.createPlayerProfile && (
            <Field label="Konami ID (optional)" full>
              <input className={inputCls} value={f.konamiId} onChange={(e) => setF({ ...f, konamiId: e.target.value })} />
            </Field>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
