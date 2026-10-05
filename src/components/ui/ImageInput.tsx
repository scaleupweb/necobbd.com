"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Trash2, ImagePlus, Link2, RefreshCw } from "lucide-react";

/** Image field: drag & drop or pick a file (stored in MongoDB), or paste an https URL. */
export function ImageInput({
  value,
  onChange,
  label,
  aspect = "square",
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: "square" | "wide";
  hint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const wide = aspect === "wide";

  const upload = async (file: File) => {
    setError("");
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
      setError("Use a PNG, JPG, WEBP or GIF image");
      return;
    }
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

  const pick = () => fileRef.current?.click();

  const preview = (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) upload(f);
      }}
      onClick={() => !value && pick()}
      className={`group relative shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
        wide ? "w-full aspect-[16/7]" : "w-28 h-28 sm:w-32 sm:h-32"
      } ${drag ? "border-[#C79A3B] bg-amber-50 scale-[1.01]" : value ? "border-slate-200 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] [background-size:16px_16px]" : "border-dashed border-slate-300 bg-slate-50 hover:border-slate-400 cursor-pointer"}`}
    >
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className={`w-full h-full ${wide ? "object-cover" : "object-contain p-1.5"}`} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 px-2 text-center">
          <ImagePlus className="w-6 h-6" />
          <span className="text-[10px] font-bold leading-tight">{drag ? "Drop to upload" : wide ? "Drag an image here or click to choose" : "Drop or click"}</span>
        </div>
      )}
      {busy && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
        </div>
      )}
      {value && !busy && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button type="button" onClick={pick} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-[11px] font-black text-slate-900">
            <RefreshCw className="w-3.5 h-3.5" /> Replace
          </button>
          <button type="button" onClick={() => onChange("")} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-600 text-white" aria-label="Remove image">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  const actions = (
    <div className="space-y-2 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B0C0F] hover:bg-black text-xs font-black text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        )}
        <button type="button" onClick={() => setShowUrl((v) => !v)} className="inline-flex items-center gap-1 px-2 py-2 text-xs font-bold text-slate-500 hover:text-slate-900">
          <Link2 className="w-3.5 h-3.5" /> {showUrl ? "Hide URL" : "Use a link"}
        </button>
      </div>
      {showUrl && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… image URL"
          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-black focus:bg-white"
        />
      )}
      <p className="text-[11px] text-slate-400">{hint || "PNG, JPG, WEBP or GIF · up to 3 MB · drag & drop works too"}</p>
      {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-2">
      {label && <label className="block text-slate-700 font-bold text-xs">{label}</label>}
      {wide ? (
        <div className="space-y-3">
          {preview}
          {actions}
        </div>
      ) : (
        <div className="flex items-start gap-4">
          {preview}
          <div className="flex-1 min-w-0 pt-1">{actions}</div>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
    </div>
  );
}
