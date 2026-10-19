"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { ImageInput } from "@/components/ui/ImageInput";
import { api, Button, Empty, Field, inputCls, Modal, Notice, PageHeader, Toggle, toLocalInput, fromLocalInput } from "./ui";
import { toast, confirmDialog, DELETE_CONFIRM_WORD } from "@/lib/feedback";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "datetime" | "select" | "checkbox" | "image" | "wideImage" | "tags";
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  full?: boolean;
  placeholder?: string;
  default?: any;
  /** Hide this field when creating (e.g. fields that only make sense later). */
  editOnly?: boolean;
};

export type Column = { label: string; render: (row: any) => ReactNode; className?: string };

export function ResourceManager({
  resource,
  title,
  subtitle,
  singular,
  fields,
  columns,
  searchKeys = ["name", "title"],
  rowActions,
  headerActions,
  reloadKey,
  onChanged,
}: {
  resource: string;
  title: string;
  subtitle?: string;
  singular: string;
  fields: FieldDef[];
  columns: Column[];
  searchKeys?: string[];
  rowActions?: (row: any, reload: () => void) => ReactNode;
  headerActions?: ReactNode;
  reloadKey?: number;
  onChanged?: () => void;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      setRows(await api(`/api/admin/resources/${resource}`));
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const openForm = (row: any | null) => {
    const f: Record<string, any> = {};
    for (const fd of fields) {
      // Older records may lack a field added later; fall back to its default.
      const v = row && row[fd.name] !== undefined ? row[fd.name] : fd.default;
      if (fd.type === "datetime") f[fd.name] = toLocalInput(v);
      else if (fd.type === "checkbox") f[fd.name] = !!v;
      else if (fd.type === "tags") f[fd.name] = Array.isArray(v) ? v.join(", ") : v || "";
      else f[fd.name] = v ?? "";
    }
    setForm(f);
    setFormError("");
    setEditing(row || {});
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const body: Record<string, any> = {};
      for (const fd of fields) {
        if (fd.editOnly && !editing?.id) continue;
        const v = form[fd.name];
        if (fd.type === "datetime") body[fd.name] = fromLocalInput(v);
        else if (fd.type === "number") body[fd.name] = v === "" ? undefined : Number(v);
        else body[fd.name] = v;
      }
      if (editing?.id) await api(`/api/admin/resources/${resource}/${editing.id}`, { method: "PATCH", json: body });
      else await api(`/api/admin/resources/${resource}`, { method: "POST", json: body });
      toast.success(editing?.id ? `${singular[0].toUpperCase()}${singular.slice(1)} updated` : `${singular[0].toUpperCase()}${singular.slice(1)} created`);
      setEditing(null);
      await load();
      onChanged?.();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: any) => {
    const name = row.name || row.title || singular;
    const ok = await confirmDialog({ title: `Delete "${name}"?`, text: "This cannot be undone.", confirmText: "Delete", danger: true, typeToConfirm: DELETE_CONFIRM_WORD });
    if (!ok) return;
    try {
      await api(`/api/admin/resources/${resource}/${row.id}`, { method: "DELETE" });
      toast.success(`"${name}" deleted`);
      await load();
      onChanged?.();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => searchKeys.some((k) => String(r[k] || "").toLowerCase().includes(q)));
  }, [rows, query, searchKeys]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {headerActions}
            <Button onClick={() => openForm(null)}>
              <Plus className="w-4 h-4" /> Add {singular}
            </Button>
          </>
        }
      />

      <div className="relative w-full sm:max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`} className={`${inputCls} pl-9`} />
      </div>

      {error && <Notice kind="err">{error}</Notice>}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty>{rows.length ? "No matches for your search." : `No ${title.toLowerCase()} yet. Click "Add ${singular}" to create one.`}</Empty>
      ) : (
        <>
        {/* Phones: one card per row — first column as the heading, the rest as label/value pairs. */}
        <div className="md:hidden space-y-2.5">
          {filtered.map((row) => {
            const [head, ...rest] = columns;
            return (
              <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm text-xs space-y-3">
                <div className="min-w-0 [&_.truncate]:whitespace-normal [&_*]:min-w-0">{head.render(row)}</div>
                {rest.length > 0 && (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {rest.map((c) => (
                      <div key={c.label} className="min-w-0">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.label}</dt>
                        <dd className="mt-0.5 text-slate-800 break-words [&_.truncate]:whitespace-normal">{c.render(row)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2.5 border-t border-slate-100">
                  {rowActions?.(row, load)}
                  <Button small variant="secondary" onClick={() => openForm(row)} title="Edit">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button small variant="ghost" onClick={() => remove(row)} title="Delete">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  {columns.map((c) => (
                    <th key={c.label} className={`py-2.5 px-3 font-bold ${c.className || ""}`}>
                      {c.label}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 align-middle">
                    {columns.map((c) => (
                      <td key={c.label} className={`py-2.5 px-3 ${c.className || ""}`}>
                        {c.render(row)}
                      </td>
                    ))}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap">
                        {rowActions?.(row, load)}
                        <Button small variant="secondary" onClick={() => openForm(row)} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button small variant="ghost" onClick={() => remove(row)} title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Edit ${singular}` : `New ${singular}`} wide>
        <form onSubmit={save} className="space-y-4">
          {formError && <Notice kind="err">{formError}</Notice>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields
              .filter((fd) => !(fd.editOnly && !editing?.id))
              .map((fd) => {
                const v = form[fd.name];
                const set = (val: any) => setForm((f) => ({ ...f, [fd.name]: val }));
                const full = fd.full || fd.type === "textarea" || fd.type === "wideImage";
                if (fd.type === "image" || fd.type === "wideImage")
                  return (
                    <div key={fd.name} className={full ? "sm:col-span-2" : ""}>
                      <ImageInput label={fd.label} value={v || ""} onChange={set} aspect={fd.type === "wideImage" ? "wide" : "square"} />
                    </div>
                  );
                if (fd.type === "checkbox")
                  return (
                    <div key={fd.name} className="flex items-end pb-1">
                      <Toggle checked={!!v} onChange={set} label={fd.label} />
                    </div>
                  );
                return (
                  <Field key={fd.name} label={`${fd.label}${fd.required ? " *" : ""}`} hint={fd.hint} full={full}>
                    {fd.type === "textarea" ? (
                      <textarea className={inputCls} rows={5} value={v} onChange={(e) => set(e.target.value)} required={fd.required} placeholder={fd.placeholder} />
                    ) : fd.type === "select" ? (
                      <select className={inputCls} value={v} onChange={(e) => set(e.target.value)} required={fd.required}>
                        {!fd.required && <option value="">—</option>}
                        {fd.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={inputCls}
                        type={fd.type === "number" ? "number" : fd.type === "datetime" ? "datetime-local" : "text"}
                        step={fd.type === "number" ? "any" : undefined}
                        value={v}
                        onChange={(e) => set(e.target.value)}
                        required={fd.required}
                        placeholder={fd.placeholder}
                      />
                    )}
                  </Field>
                );
              })}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editing?.id ? "Save changes" : `Create ${singular}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
