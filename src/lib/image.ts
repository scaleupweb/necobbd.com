"use client";

/**
 * Shrinks a photo in the browser before upload: longest side at most `max` px,
 * re-encoded as JPEG. A phone photo of several MB comes out around 50–150 KB.
 */
export async function compressImage(file: File, max = 512, quality = 0.82): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("This file is not an image we can read"));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; // JPEG has no transparency
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) throw new Error("Could not process the image");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Uploads an image (signed-in users only) and returns its /api/media URL. */
export async function uploadImage(blob: Blob, name = "photo.jpg"): Promise<string> {
  const fd = new FormData();
  fd.append("file", blob, name);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Upload failed");
  return json.data.url;
}
