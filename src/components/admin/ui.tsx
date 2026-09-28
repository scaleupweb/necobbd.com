"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export const inputCls =
  "w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white";

export async function api<T = any>(url: string, init?: RequestInit & { json?: any }): Promise<T> {
  const { json, ...rest } = init || {};
  const res = await fetch(url, {
    cache: "no-store",
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers || {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({ success: false, error: { message: `HTTP ${res.status}` } }));
  if (!data.success) throw new Error(data.error?.message || `Request failed (${res.status})`);
  return data.data as T;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-950">{title}</h1>
        {subtitle && <p className="text-xs text-slate-600 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  small,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  type?: "button" | "submit";
  disabled?: boolean;
  small?: boolean;
  title?: string;
}) {
  const v = {
    primary: "bg-black text-white hover:bg-zinc-800",
    secondary: "bg-white text-slate-800 border border-slate-200 hover:border-black",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    ghost: "text-slate-600 hover:text-black hover:bg-slate-100",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        small ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2 text-xs"
      } ${v}`}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto" onMouseDown={onClose}>
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-3xl bg-white border border-slate-200 shadow-2xl my-auto`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, children, full }: { label: string; hint?: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={`block space-y-1 ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-slate-700 font-bold text-xs">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-xs font-bold text-slate-700" aria-pressed={checked}>
      <span className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-emerald-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "red" | "amber" | "blue" | "black" }) {
  const t = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    blue: "bg-sky-50 text-sky-800 border-sky-200",
    black: "bg-black text-white border-black",
  }[tone];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${t}`}>{children}</span>;
}

export function statusTone(s?: string): "slate" | "green" | "red" | "amber" | "blue" | "black" {
  if (!s) return "slate";
  if (["ACTIVE", "REGISTRATION_OPEN", "APPROVED", "ACCEPTED", "ONGOING", "LISTED"].includes(s)) return "green";
  if (["SUSPENDED", "BANNED", "CANCELLED", "REJECTED", "REVOKED", "LIVE"].includes(s)) return "red";
  if (["PENDING", "PENDING_VERIFICATION", "REGISTRATION_CLOSED", "POSTPONED", "DRAFT"].includes(s)) return "amber";
  if (["COMPLETED", "FINISHED"].includes(s)) return "black";
  return "slate";
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500">{children}</div>;
}

export function Notice({ kind, children }: { kind: "ok" | "err"; children: ReactNode }) {
  return (
    <div className={`p-3 rounded-xl text-xs font-semibold border ${kind === "ok" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
      {children}
    </div>
  );
}

/** Convert an ISO date to the value format of <input type="datetime-local"> in local time. */
export function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert a datetime-local value (local time) to ISO. */
export function fromLocalInput(v: string) {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}
