"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";

/** Image field: upload a file (stored in MongoDB) or paste an https URL. */
export function ImageInput({
  value,
  onChange,
  label,
  aspect = "square",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: "square" | "wide";
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setError("");
    if (file.size > 3 * 1024 * 1024) {
      setError("Max 3 MB");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Upload failed");
      onChange(json.data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-slate-700 font-bold text-xs">{label}</label>}
      <div className="flex items-start gap-3">
        <div
          className={`relative shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 ${aspect === "wide" ? "w-28 h-16" : "w-16 h-16"}`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No image</div>
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
              aria-label="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {busy ? "Uploading…" : "Upload image"}
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste https:// image URL"
            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-black focus:bg-white"
          />
          {error && <p className="text-[11px] text-rose-600">{error}</p>}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
    </div>
  );
}
