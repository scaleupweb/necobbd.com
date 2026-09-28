"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { api, Empty, inputCls, Notice, PageHeader } from "@/components/admin/ui";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    api<any[]>("/api/admin/audit-logs").then(setLogs).catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!logs || !s) return logs || [];
    return logs.filter((l) => [l.adminName, l.action, l.target, l.details].some((v) => String(v || "").toLowerCase().includes(s)));
  }, [logs, q]);

  return (
    <div className="space-y-5">
      <PageHeader title="Audit Log" subtitle="Every admin action, who did it, when and from which IP." />
      {error && <Notice kind="err">{error}</Notice>}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input className={`${inputCls} pl-9`} placeholder="Filter by admin, action, target…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {logs === null ? (
        <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <Empty>No log entries.</Empty>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">When</th>
                <th className="py-2.5 px-3">Admin</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 px-3 whitespace-nowrap text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-3 font-bold">{l.adminName}</td>
                  <td className="py-2 px-3 font-mono text-[11px]">{l.action}</td>
                  <td className="py-2 px-3">{l.target}</td>
                  <td className="py-2 px-3 text-slate-600 max-w-xs truncate" title={l.details}>
                    {l.details}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-400">{l.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
