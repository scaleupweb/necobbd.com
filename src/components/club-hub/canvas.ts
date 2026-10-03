// Canvas helpers shared by the transfer card and the player card generators.
import { CONTRACT_DAYS, contractDaysLeft } from "@/lib/squad";
import { formatDate } from "@/lib/utils";

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

/** A player's current details as a 1080×1350 card image. */
export async function renderPlayerCard(canvas: HTMLCanvasElement, player: any, club: any) {
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const gold = "#E8B95A";
  const [photo, logo] = await Promise.all([loadImage(player.avatar), loadImage(club?.logo || "")]);

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0B0C0F");
  bg.addColorStop(0.6, "#121318");
  bg.addColorStop(1, "#1d1606");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  if (logo) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.filter = "blur(80px)";
    drawCover(ctx, logo, -200, -100, W + 400, 800);
    ctx.restore();
  }
  const glow = ctx.createRadialGradient(W / 2, 380, 40, W / 2, 380, 560);
  glow.addColorStop(0, "rgba(232,185,90,0.30)");
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

  // Top bar: brand + club
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = gold;
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText("N E C O B   ·   P L A Y E R   C A R D", 70, 92);
  if (club) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    fitFont(ctx, club.name.toUpperCase(), 360, 28, 900);
    ctx.fillText(club.name.toUpperCase(), W - 150, 92);
    if (logo) {
      ctx.save();
      roundRect(ctx, W - 130, 50, 60, 60, 14);
      ctx.fillStyle = "#fff";
      ctx.fill();
      roundRect(ctx, W - 126, 54, 52, 52, 11);
      ctx.clip();
      drawCover(ctx, logo, W - 126, 54, 52, 52);
      ctx.restore();
    }
  }

  // Photo
  const cx = W / 2;
  const cy = 390;
  const R = 220;
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
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = `900 170px ${FONT}`;
    ctx.fillText((player.fullName || "?").charAt(0).toUpperCase(), cx, cy + 60);
  }
  ctx.restore();

  // Shirt number badge
  if (player.shirtNo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx + R * 0.72, cy + R * 0.72, 62, 0, Math.PI * 2);
    ctx.fillStyle = "#4F46E5";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#0B0C0F";
    ctx.beginPath();
    ctx.arc(cx + R * 0.72, cy + R * 0.72, 62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = `900 52px ${FONT}`;
    ctx.fillText(String(player.shirtNo), cx + R * 0.72, cy + R * 0.72 + 18);
  }

  // Name
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  fitFont(ctx, player.fullName.toUpperCase(), W - 140, 84);
  ctx.fillText(player.fullName.toUpperCase(), W / 2, 742);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `600 30px ${MONO}`;
  ctx.fillText(`@${player.username}`, W / 2, 790);

  // Info tiles
  const left = contractDaysLeft(player.contract?.endDate);
  const tiles: [string, string][] = [
    ["KONAMI UID", player.konamiId || "—"],
    ["DEVICE", player.deviceModel || "—"],
    ["POSITION", player.preferredPosition || "—"],
    ["SHIRT · SEAT", `${player.shirtNo ? `#${player.shirtNo}` : "—"}${player.seat ? ` · Seat ${player.seat}` : ""}`],
    ["CLUB", club?.name || "No club"],
    ["CONTRACT", player.contract?.endDate ? `${left}/${CONTRACT_DAYS} days · ${formatDate(player.contract.endDate)}` : "—"],
  ];
  const tw = 450;
  const th = 94;
  const gx = 30;
  const x0 = (W - tw * 2 - gx) / 2;
  tiles.forEach(([label, value], i) => {
    const x = x0 + (i % 2) * (tw + gx);
    const y = 826 + Math.floor(i / 2) * (th + 16);
    roundRect(ctx, x, y, tw, th, 22);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = gold;
    ctx.font = `800 20px ${FONT}`;
    ctx.fillText(label, x + 28, y + 36);
    ctx.fillStyle = "#fff";
    const mono = label === "KONAMI UID";
    fitFont(ctx, value, tw - 56, 32, 800, mono ? MONO : FONT);
    ctx.fillText(value, x + 28, y + 76);
  });

  // Stats strip
  const s = player.stats || {};
  const stats: [string, string | number][] = [
    ["RATING", player.rating ?? "—"],
    ["MATCHES", s.matchesPlayed ?? 0],
    ["WINS", s.wins ?? 0],
    ["GOALS", s.goalsScored ?? 0],
  ];
  const sy = 1240;
  roundRect(ctx, x0, sy - 66, tw * 2 + gx, 88, 22);
  const sg = ctx.createLinearGradient(x0, 0, x0 + tw * 2 + gx, 0);
  sg.addColorStop(0, "#F7DC8B");
  sg.addColorStop(1, "#C79A3B");
  ctx.fillStyle = sg;
  ctx.fill();
  const cw = (tw * 2 + gx) / stats.length;
  stats.forEach(([k, v], i) => {
    const mx = x0 + cw * i + cw / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = "#0B0C0F";
    ctx.font = `900 38px ${MONO}`;
    ctx.fillText(String(v), mx, sy - 10);
    ctx.font = `800 16px ${FONT}`;
    ctx.fillStyle = "rgba(11,12,15,0.65)";
    ctx.fillText(k, mx, sy + 12);
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText(`NATIONAL eFOOTBALL COMMUNITY OF BANGLADESH · ${formatDate(new Date().toISOString())}`, W / 2, 1308);
}
