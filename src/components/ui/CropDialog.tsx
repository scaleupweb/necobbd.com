"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { Area } from "react-easy-crop";
import { Loader2, Minus, Plus, RotateCw, X } from "lucide-react";
import { cropImage, prepareForCrop } from "@/lib/image";

/**
 * Lets the user choose which part of a photo to keep before it is uploaded:
 * drag to move, pinch / scroll / slider to zoom, optional rotate.
 * Resolves the cropped image as a Blob (longest side at most `maxSize` px).
 */
export function CropDialog({
  file,
  aspect = 1,
  round = false,
  maxSize = 800,
  title = "Adjust your photo",
  onCancel,
  onDone,
}: {
  file: File | null;
  aspect?: number;
  round?: boolean;
  maxSize?: number;
  title?: string;
  onCancel: () => void;
  onDone: (blob: Blob) => void | Promise<void>;
}) {
  const [src, setSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) return;
    let url = "";
    let cancelled = false;
    setSrc("");
    setArea(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setError("");
    // Big camera photos are shrunk first — phones can't draw them inside the cropper.
    prepareForCrop(file)
      .then((u) => {
        if (cancelled) return URL.revokeObjectURL(u);
        url = u;
        setSrc(u);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    if (!file) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [file, busy, onCancel]);

  if (!file || typeof document === "undefined") return null;

  const save = async () => {
    if (!area || !src) return;
    setBusy(true);
    setError("");
    try {
      // Keep PNG for PNGs (logos with transparent backgrounds), JPEG for photos.
      const type = file.type === "image/png" ? "image/png" : "image/jpeg";
      await onDone(await cropImage(src, area, { maxSize, rotation, type }));
    } catch (e: any) {
      setError(e.message || "Could not crop the image");
    } finally {
      setBusy(false);
    }
  };

  const step = (d: number) => setZoom((z) => Math.min(4, Math.max(1, +(z + d).toFixed(2))));

  // Rendered into <body> so no parent (cards, forms, the mobile bottom nav) can sit on top of it.
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-6" role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-lg max-h-[100dvh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-950">{title}</h3>
          <button type="button" onClick={onCancel} disabled={busy} className="text-slate-400 hover:text-slate-800" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-full h-[50dvh] max-h-[420px] min-h-[240px] shrink bg-slate-900">
          {src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape={round ? "round" : "rect"}
              showGrid={!round}
              minZoom={1}
              maxZoom={4}
              zoomSpeed={0.15}
              objectFit="contain"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(_, px) => setArea(px)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              {error ? <p className="text-xs font-bold text-rose-300">{error}</p> : <Loader2 className="w-7 h-7 animate-spin text-white/70" />}
            </div>
          )}
        </div>

        <div className="px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3 shrink-0">
          <p className="text-[11px] text-slate-500 text-center">Drag to move · pinch, scroll or use the slider to zoom</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => step(-0.2)} className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center" aria-label="Zoom out">
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-black"
              aria-label="Zoom"
            />
            <button type="button" onClick={() => step(0.2)} className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center" aria-label="Zoom in">
              <Plus className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setRotation((r) => (r + 90) % 360)} className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center" aria-label="Rotate">
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
          {error && src && <p className="text-[11px] font-bold text-rose-600 text-center">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={busy || !area || !src} className="flex-1 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-50">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
