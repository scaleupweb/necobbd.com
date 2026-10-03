// Canvas helpers shared by the transfer card and the player card generators.

export const FONT = `"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif`;
const MONO = `"JetBrains Mono", Consolas, monospace`;

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight = 900, family = FONT) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    s -= 2;
  } while (s > 16);
  return s;
}

export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const r = Math.max(w / img.width, h / img.height);
  const iw = img.width * r;
  const ih = img.height * r;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Save a canvas as a PNG file (one click on phone and desktop). */
export async function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
  const blob: Blob | null = await new Promise((res) => {
    try {
      canvas.toBlob((b) => res(b), "image/png");
    } catch {
      res(null);
    }
  });
  if (!blob) throw new Error("Could not create the image");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** A player's editable details (photo, name, Konami ID, device, shirt number) as a 1080×1350 card. */
export async function renderPlayerCard(canvas: HTMLCanvasElement, player: any) {
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const gold = "#E8B95A";
  const photo = await loadImage(player.avatar);

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0B0C0F");
  bg.addColorStop(0.6, "#121318");
  bg.addColorStop(1, "#1d1606");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 420, 40, W / 2, 420, 600);
  glow.addColorStop(0, "rgba(232,185,90,0.32)");
  glow.addColorStop(1, "rgba(232,185,90,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = "#fff";
  for (let x = 0; x <= W; x += 54) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.fillStyle = gold;
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText("P L A Y E R   C A R D", W / 2, 100);

  // Photo
  const cx = W / 2;
  const cy = 420;
  const R = 240;
  ctx.save();
  ctx.shadowColor = "rgba(232,185,90,0.6)";
  ctx.shadowBlur = 60;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 14, 0, Math.PI * 2);
  const ring = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  ring.addColorStop(0, "#F7DC8B");
  ring.addColorStop(0.5, "#C79A3B");
  ring.addColorStop(1, "#8a6420");
  ctx.fillStyle = ring;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  if (photo) drawCover(ctx, photo, cx - R, cy - R, R * 2, R * 2);
  else {
    ctx.fillStyle = "#fff";
    ctx.font = `900 180px ${FONT}`;
    ctx.fillText((player.fullName || "?").charAt(0).toUpperCase(), cx, cy + 64);
  }
  ctx.restore();

  // Name + username · position
  ctx.fillStyle = "#fff";
  fitFont(ctx, player.fullName.toUpperCase(), W - 140, 88);
  ctx.fillText(player.fullName.toUpperCase(), W / 2, 790);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `600 32px ${MONO}`;
  ctx.fillText(`@${player.username}${player.preferredPosition ? ` · ${player.preferredPosition}` : ""}`, W / 2, 842);

  // Detail tiles: Konami ID (full width), then device + shirt number
  const x0 = 120;
  const full = W - x0 * 2;
  const gap = 24;
  const th = 120;
  const tile = (label: string, value: string, x: number, y: number, w: number, mono = false, big = false) => {
    roundRect(ctx, x, y, w, th, 24);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = gold;
    ctx.font = `800 22px ${FONT}`;
    ctx.fillText(label, x + 30, y + 42);
    ctx.fillStyle = "#fff";
    fitFont(ctx, value, w - 60, big ? 46 : 38, 800, mono ? MONO : FONT);
    ctx.fillText(value, x + 30, y + 94);
  };
  tile("KONAMI USER ID", player.konamiId || "—", x0, 900, full, true, true);
  const half = (full - gap) / 2;
  tile("DEVICE", player.deviceModel || "—", x0, 900 + th + gap, half);
  tile("SHIRT NUMBER", player.shirtNo ? `#${player.shirtNo}` : "—", x0 + half + gap, 900 + th + gap, half, true, true);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText("NECOB · NATIONAL eFOOTBALL COMMUNITY OF BANGLADESH", W / 2, 1300);
}
