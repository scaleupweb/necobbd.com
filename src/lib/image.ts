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

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("This file is not an image we can read"));
    i.src = src;
  });

/**
 * Makes a phone photo safe to show in the crop window. 50–200 MP camera photos are
 * far larger than a phone's GPU can draw in a zoomable/transformed element, so the
 * browser silently shows nothing. Shrinks the longest side to `max` px first.
 * Resolves an object URL (the caller revokes it).
 */
export async function prepareForCrop(file: File, max = 2048): Promise<string> {
  const original = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(original);
  } catch {
    URL.revokeObjectURL(original);
    throw new Error("This photo can't be opened here. Try a JPG or PNG (on Samsung/iPhone, choose a regular photo or a screenshot).");
  }
  if (Math.max(img.naturalWidth, img.naturalHeight) <= max) return original;
  const scale = max / Math.max(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d")!;
  const png = file.type === "image/png";
  if (!png) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(original);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, png ? "image/png" : "image/jpeg", 0.92));
  if (!blob) throw new Error("Could not process the image");
  return URL.createObjectURL(blob);
}

/**
 * Cuts out the chosen area (pixels from react-easy-crop, measured on the rotated
 * image) and scales it so the longest side is at most `maxSize`.
 */
export async function cropImage(
  src: string,
  area: { x: number; y: number; width: number; height: number },
  opts: { maxSize?: number; rotation?: number; type?: "image/jpeg" | "image/png"; quality?: number } = {}
): Promise<Blob> {
  const { maxSize = 800, rotation = 0, type = "image/jpeg", quality = 0.85 } = opts;
  const img = await loadImage(src);
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  // Bounding box of the rotated image — the coordinate space `area` is in.
  const bw = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
  const bh = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);

  const rotated = document.createElement("canvas");
  rotated.width = bw;
  rotated.height = bh;
  const rctx = rotated.getContext("2d")!;
  rctx.translate(bw / 2, bh / 2);
  rctx.rotate(rad);
  rctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  const scale = Math.min(1, maxSize / Math.max(area.width, area.height));
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(area.width * scale));
  out.height = Math.max(1, Math.round(area.height * scale));
  const ctx = out.getContext("2d")!;
  if (type === "image/jpeg") {
    ctx.fillStyle = "#fff"; // JPEG has no transparency
    ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(rotated, area.x, area.y, area.width, area.height, 0, 0, out.width, out.height);
  const blob = await new Promise<Blob | null>((res) => out.toBlob(res, type, quality));
  if (!blob) throw new Error("Could not process the image");
  return blob;
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
