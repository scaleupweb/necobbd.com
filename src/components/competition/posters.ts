// Shareable PNG posters for competition matches: the full result (every 1v1 game) and the Man of the Match.

import { FONT, loadImage, fitFont, drawCover, roundRect } from "@/components/club-hub/canvas";

export type PosterTheme = "gold" | "neon" | "obsidian" | "crimson";

type Palette = { bg: [string, string]; accent: string; accent2: string; text: string; muted: string; panel: string; line: string; onAccent: string };

export const THEMES: Record<PosterTheme, Palette & { label: string; swatch: string }> = {
  gold: { label: "Gold", swatch: "#f5a524", bg: ["#0b0805", "#1d1407"], accent: "#f5a524", accent2: "#ffd36b", text: "#ffffff", muted: "rgba(255,255,255,0.55)", panel: "rgba(255,255,255,0.04)", line: "rgba(245,165,36,0.35)", onAccent: "#120c02" },
  neon: { label: "Neon", swatch: "#22d3ee", bg: ["#04050d", "#0d0f2e"], accent: "#22d3ee", accent2: "#a855f7", text: "#ffffff", muted: "rgba(255,255,255,0.55)", panel: "rgba(34,211,238,0.05)", line: "rgba(34,211,238,0.35)", onAccent: "#02121a" },
  obsidian: { label: "Obsidian", swatch: "#d4d4d8", bg: ["#09090b", "#1f1f23"], accent: "#e4e4e7", accent2: "#a1a1aa", text: "#ffffff", muted: "rgba(255,255,255,0.5)", panel: "rgba(255,255,255,0.04)", line: "rgba(255,255,255,0.18)", onAccent: "#09090b" },
  crimson: { label: "Crimson", swatch: "#f43f5e", bg: ["#100307", "#2b0712"], accent: "#f43f5e", accent2: "#fb923c", text: "#ffffff", muted: "rgba(255,255,255,0.55)", panel: "rgba(244,63,94,0.05)", line: "rgba(244,63,94,0.35)", onAccent: "#1a0207" },
};

const W = 1080;

function background(ctx: CanvasRenderingContext2D, h: number, p: Palette) {
  const g = ctx.createLinearGradient(0, 0, W, h);
  g.addColorStop(0, p.bg[0]);
  g.addColorStop(1, p.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, h);
  // soft glow top-right and bottom-left
  for (const [x, y, c] of [
    [W * 0.9, 80, p.accent],
    [W * 0.1, h - 80, p.accent2],
  ] as const) {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, 520);
    rg.addColorStop(0, c + "33");
    rg.addColorStop(1, "transparent");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, h);
  }
  // fine diagonal lines
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  for (let x = -h; x < W; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h, h);
    ctx.stroke();
  }
  ctx.restore();
  // border
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 3;
  roundRect(ctx, 18, 18, W - 36, h - 36, 34);
  ctx.stroke();
}

function pill(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, p: Palette, filled = false, size = 20) {
  ctx.font = `900 ${size}px ${FONT}`;
  const label = text.toUpperCase().split("").join(String.fromCharCode(8202));
  const w = ctx.measureText(label).width + 44;
  roundRect(ctx, cx - w / 2, y, w, size + 22, (size + 22) / 2);
  ctx.fillStyle = filled ? p.accent : "rgba(0,0,0,0.35)";
  ctx.fill();
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = filled ? p.onAccent : p.accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, y + (size + 22) / 2 + 1);
  return w;
}

async function circleImage(ctx: CanvasRenderingContext2D, src: string, cx: number, cy: number, r: number, ring: string, fallback: string) {
  const img = await loadImage(src);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#1c1c1f";
  ctx.fill();
  ctx.clip();
  if (img) drawCover(ctx, img, cx - r, cy - r, r * 2, r * 2);
  else {
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${r * 0.8}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((fallback || "?").slice(0, 2).toUpperCase(), cx, cy + 2);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = ring;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function brand(ctx: CanvasRenderingContext2D, p: Palette, logo: HTMLImageElement | null, title: string, sub: string, y = 54) {
  // Logo tile
  roundRect(ctx, 56, y, 78, 78, 20);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (logo) {
    ctx.save();
    roundRect(ctx, 62, y + 6, 66, 66, 16);
    ctx.clip();
    drawCover(ctx, logo, 62, y + 6, 66, 66);
    ctx.restore();
  } else {
    ctx.fillStyle = p.accent;
    ctx.font = `900 26px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", 95, y + 40);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = p.text;
  fitFont(ctx, title.toUpperCase(), 560, 34);
  ctx.fillText(title.toUpperCase(), 156, y + 38);
  ctx.fillStyle = p.accent;
  ctx.font = `800 19px ${FONT}`;
  ctx.fillText(sub.toUpperCase(), 156, y + 68);
}

export type PosterData = {
  tournament: { name: string; logo?: string; season?: string };
  fixture: any; // shaped competition fixture with games
  site?: string;
};

/** Full match result: score, both clubs and every individual game. */
export async function renderMatchPoster(canvas: HTMLCanvasElement, data: PosterData, theme: PosterTheme) {
  const p = THEMES[theme];
  const f = data.fixture;
  const games: any[] = f.games || [];
  const rowH = 74;
  const H = Math.max(1080, 690 + games.length * rowH + 150);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await document.fonts?.ready;
  background(ctx, H, p);

  const logo = await loadImage(data.tournament.logo || "");
  brand(ctx, p, logo, data.tournament.name, [f.round, f.matchNo ? `Match #${f.matchNo}` : ""].filter(Boolean).join(" · "));
  // Verified pill (top-right)
  ctx.font = `900 17px ${FONT}`;
  const vw = ctx.measureText("VERIFIED RESULT").width + 40;
  roundRect(ctx, W - 56 - vw, 72, vw, 42, 21);
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = p.accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✓ VERIFIED RESULT", W - 56 - vw / 2, 94);

  // Score panel
  const py = 170;
  roundRect(ctx, 56, py, W - 112, 330, 30);
  ctx.fillStyle = p.panel;
  ctx.fill();
  ctx.strokeStyle = p.line;
  ctx.stroke();
  const hp = f.result?.homeScore ?? 0;
  const ap = f.result?.awayScore ?? 0;
  for (const [club, cx, win] of [
    [f.homeClub, 250, hp > ap],
    [f.awayClub, W - 250, ap > hp],
  ] as const) {
    await circleImage(ctx, club?.logo || "", cx, py + 120, 72, win ? p.accent : p.line, club?.shortName || club?.name || "");
    ctx.fillStyle = win ? p.text : p.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const name = (club?.name || "TBD").toUpperCase();
    fitFont(ctx, name, 330, 30);
    ctx.fillText(name, cx, py + 245);
    if (win) {
      ctx.font = `900 15px ${FONT}`;
      ctx.fillStyle = p.accent;
      ctx.fillText("WINNER", cx, py + 278);
    }
  }
  // Big score digits
  for (const [v, x, win] of [
    [hp, W / 2 - 78, hp > ap],
    [ap, W / 2 + 78, ap > hp],
  ] as const) {
    roundRect(ctx, x - 64, py + 62, 128, 128, 26);
    ctx.fillStyle = win ? p.accent : "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.fillStyle = win ? p.onAccent : p.text;
    ctx.font = `900 76px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(v), x, py + 130);
  }
  ctx.fillStyle = p.muted;
  ctx.font = `900 40px ${FONT}`;
  ctx.fillText("-", W / 2, py + 126);
  ctx.font = `800 18px ${FONT}`;
  ctx.fillStyle = p.muted;
  ctx.fillText(`GAME POINTS  ·  GOALS ${f.result?.homeGoals ?? 0} - ${f.result?.awayGoals ?? 0}`, W / 2, py + 222);

  // Individual games
  let y = py + 370;
  pill(ctx, "Individual score", W / 2, y - 22, p);
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, y);
  ctx.lineTo(W / 2 - 170, y);
  ctx.moveTo(W / 2 + 170, y);
  ctx.lineTo(W - 80, y);
  ctx.stroke();
  y += 46;
  const motm = f.result?.motmPlayerId;
  for (const g of games) {
    const hw = g.homeGoals > g.awayGoals;
    const aw = g.awayGoals > g.homeGoals;
    roundRect(ctx, 56, y, W - 112, rowH - 12, 18);
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fill();
    const mid = y + (rowH - 12) / 2;
    await circleImage(ctx, g.homePlayer?.avatar || "", 104, mid, 24, hw ? p.accent : "rgba(255,255,255,0.15)", g.homePlayer?.fullName || "");
    await circleImage(ctx, g.awayPlayer?.avatar || "", W - 104, mid, 24, aw ? p.accent : "rgba(255,255,255,0.15)", g.awayPlayer?.fullName || "");
    ctx.textBaseline = "middle";
    for (const [pl, x, align, win] of [
      [g.homePlayer, 142, "left", hw],
      [g.awayPlayer, W - 142, "right", aw],
    ] as const) {
      const name = (pl?.fullName || "Unknown") + (motm && pl?.id === motm ? "  ★" : "");
      ctx.textAlign = align;
      ctx.fillStyle = win ? p.accent : p.text;
      fitFont(ctx, name, 300, 24, 800);
      ctx.fillText(name, x, mid + 1);
    }
    for (const [v, x, win] of [
      [g.homeGoals, W / 2 - 40, hw],
      [g.awayGoals, W / 2 + 40, aw],
    ] as const) {
      roundRect(ctx, x - 24, mid - 24, 48, 48, 10);
      ctx.fillStyle = win ? p.accent : "rgba(255,255,255,0.1)";
      ctx.fill();
      ctx.fillStyle = win ? p.onAccent : p.text;
      ctx.font = `900 26px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(String(v), x, mid + 1);
    }
    ctx.fillStyle = p.muted;
    ctx.font = `900 22px ${FONT}`;
    ctx.fillText("–", W / 2, mid);
    y += rowH;
  }

  // Footer
  const fy = H - 92;
  if (f.result?.motmPlayerName) {
    ctx.textAlign = "left";
    ctx.fillStyle = p.accent;
    ctx.font = `900 20px ${FONT}`;
    ctx.fillText(`★ MAN OF THE MATCH: ${f.result.motmPlayerName.toUpperCase()}`, 70, fy);
  }
  ctx.textAlign = "right";
  ctx.fillStyle = p.muted;
  ctx.font = `800 18px ${FONT}`;
  ctx.fillText((data.site || "necobbd.com").toUpperCase(), W - 70, fy);
}

/** Man of the Match poster: big player photo with his game and the match score. */
export async function renderMotmPoster(canvas: HTMLCanvasElement, data: PosterData, theme: PosterTheme) {
  const p = THEMES[theme];
  const f = data.fixture;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await document.fonts?.ready;
  background(ctx, H, p);
  const motmId = f.result?.motmPlayerId;
  const g = (f.games || []).find((x: any) => x.homePlayer?.id === motmId || x.awayPlayer?.id === motmId);
  const isHome = g?.homePlayer?.id === motmId;
  const player = g ? (isHome ? g.homePlayer : g.awayPlayer) : null;
  const opp = g ? (isHome ? g.awayPlayer : g.homePlayer) : null;
  const club = isHome ? f.homeClub : f.awayClub;

  // Photo
  const photo = await loadImage(player?.avatar || f.result?.motmPlayerAvatar || "");
  ctx.save();
  roundRect(ctx, 18, 18, W - 36, H - 36, 34);
  ctx.clip();
  if (photo) drawCover(ctx, photo, 0, 0, W, H * 0.78);
  const fade = ctx.createLinearGradient(0, H * 0.38, 0, H * 0.8);
  fade.addColorStop(0, "transparent");
  fade.addColorStop(1, p.bg[1]);
  ctx.fillStyle = fade;
  ctx.fillRect(0, H * 0.38, W, H * 0.44);
  ctx.fillStyle = p.bg[1];
  ctx.fillRect(0, H * 0.8, W, H * 0.2);
  const top = ctx.createLinearGradient(0, 0, 0, 220);
  top.addColorStop(0, "rgba(0,0,0,0.7)");
  top.addColorStop(1, "transparent");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, 220);
  ctx.restore();
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 3;
  roundRect(ctx, 18, 18, W - 36, H - 36, 34);
  ctx.stroke();

  const logo = await loadImage(data.tournament.logo || "");
  brand(ctx, p, logo, data.tournament.name, f.round || "");

  // Info card
  const cy = 860;
  roundRect(ctx, 56, cy, W - 112, 420, 30);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = "left";
  pill(ctx, "★ Man of the match", 56 + 40 + 150, cy + 34, p, true, 18);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = p.text;
  const name = (player?.fullName || f.result?.motmPlayerName || "Man of the Match").toUpperCase();
  fitFont(ctx, name, W - 200, 78);
  ctx.fillText(name, 96, cy + 160);
  ctx.fillStyle = p.accent;
  ctx.font = `800 24px ${FONT}`;
  ctx.fillText((club?.name || "").toUpperCase(), 96, cy + 200);

  if (g) {
    // His game
    const gy = cy + 236;
    roundRect(ctx, 96, gy, W - 192, 96, 22);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    const myGoals = isHome ? g.homeGoals : g.awayGoals;
    const oppGoals = isHome ? g.awayGoals : g.homeGoals;
    ctx.textBaseline = "middle";
    await circleImage(ctx, player?.avatar || "", 150, gy + 48, 30, p.accent, player?.fullName || "");
    await circleImage(ctx, opp?.avatar || "", W - 150, gy + 48, 30, "rgba(255,255,255,0.2)", opp?.fullName || "");
    ctx.textAlign = "left";
    ctx.fillStyle = p.accent;
    fitFont(ctx, player?.fullName || "", 250, 24, 800);
    ctx.fillText(player?.fullName || "", 194, gy + 48);
    ctx.textAlign = "right";
    ctx.fillStyle = p.text;
    fitFont(ctx, opp?.fullName || "", 250, 24, 800);
    ctx.fillText(opp?.fullName || "", W - 194, gy + 48);
    roundRect(ctx, W / 2 - 70, gy + 22, 140, 52, 14);
    ctx.fillStyle = p.accent;
    ctx.fill();
    ctx.fillStyle = p.onAccent;
    ctx.textAlign = "center";
    ctx.font = `900 30px ${FONT}`;
    ctx.fillText(`${myGoals} - ${oppGoals}`, W / 2, gy + 49);
  }
  // Match line
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = p.muted;
  const line = `${f.homeClub?.name || ""} ${f.result?.homeScore ?? 0} - ${f.result?.awayScore ?? 0} ${f.awayClub?.name || ""}`;
  fitFont(ctx, line, W - 200, 22, 700);
  ctx.fillText(line, W / 2, cy + 384);
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText((data.site || "necobbd.com").toUpperCase(), W / 2, H - 40);
}

/** Plain-text result for chats. */
export function resultSummary(data: PosterData) {
  const f = data.fixture;
  const lines = [
    `🏆 ${data.tournament.name}`,
    `${f.round}${f.matchNo ? ` · Match #${f.matchNo}` : ""}`,
    "",
    `${f.homeClub?.name} ${f.result?.homeScore ?? 0} - ${f.result?.awayScore ?? 0} ${f.awayClub?.name}`,
    `Goals: ${f.result?.homeGoals ?? 0} - ${f.result?.awayGoals ?? 0}`,
    "",
    ...(f.games || []).map((g: any, i: number) => `${i + 1}. ${g.homePlayer?.fullName || "?"} ${g.homeGoals} - ${g.awayGoals} ${g.awayPlayer?.fullName || "?"}`),
  ];
  if (f.result?.motmPlayerName) lines.push("", `⭐ Man of the Match: ${f.result.motmPlayerName}`);
  return lines.join("\n");
}
