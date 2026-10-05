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

/** Shorten text with "…" so it fits `maxWidth` in the current font. */
function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

/** Circle-cropped image (or initials) with a gold ring. */
function drawAvatar(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, name: string, x: number, y: number, size: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = "#E2E8F0";
  ctx.fillRect(x, y, size, size);
  if (img) drawCover(ctx, img, x, y, size, size);
  else {
    ctx.fillStyle = "#64748B";
    ctx.font = `900 ${Math.round(size * 0.38)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const ini = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    ctx.fillText(ini, x + size / 2, y + size / 2 + 1);
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "#E8B95A";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 1.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * A full squad sheet to share in the club group: every player with seat, photo, name,
 * username, Konami UID, device, position and contract, so players can check their details.
 */
export async function renderSquadSheet(canvas: HTMLCanvasElement, club: any, squad: any[], opts: { includePhone?: boolean; site?: string; limit?: number } = {}) {
  const W = 1360;
  const HEADER = 330;
  const COLS = 58;
  const ROW = 108;
  const FOOT = 120;
  const players = [...squad].sort(
    (a, b) => (a.seat || 999) - (b.seat || 999) || (a.shirtNo || 999) - (b.shirtNo || 999) || String(a.fullName).localeCompare(String(b.fullName))
  );
  const H = HEADER + COLS + Math.max(1, players.length) * ROW + FOOT;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const gold = "#E8B95A";
  const photo = (p: any) => (p.avatar && !String(p.avatar).startsWith("/images/placeholders") ? loadImage(p.avatar) : Promise.resolve(null));
  const [logo, ...avatars] = await Promise.all([loadImage(club.logo), ...players.map(photo)]);

  // ---- page
  ctx.fillStyle = "#F6F7F9";
  ctx.fillRect(0, 0, W, H);

  // ---- header
  const hg = ctx.createLinearGradient(0, 0, W, HEADER);
  hg.addColorStop(0, "#07080B");
  hg.addColorStop(1, "#16130b");
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, W, HEADER);
  if (logo) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.filter = "blur(60px)";
    drawCover(ctx, logo, W - 600, -100, 700, 500);
    ctx.restore();
  }
  const glow = ctx.createRadialGradient(160, 60, 10, 160, 60, 420);
  glow.addColorStop(0, "rgba(232,185,90,0.35)");
  glow.addColorStop(1, "rgba(232,185,90,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, HEADER);

  // logo tile
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 30;
  roundRect(ctx, 56, 60, 150, 150, 34);
  const lg = ctx.createLinearGradient(56, 60, 206, 210);
  lg.addColorStop(0, "#FFE9A8");
  lg.addColorStop(1, "#9A6E22");
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, 62, 66, 138, 138, 30);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.clip();
  if (logo) drawCover(ctx, logo, 62, 66, 138, 138);
  ctx.restore();

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = gold;
  ctx.font = `800 22px ${FONT}`;
  ctx.fillText("M A I N   T E A M   S Q U A D", 240, 98);
  ctx.fillStyle = "#fff";
  fitFont(ctx, String(club.name).toUpperCase(), W - 300, 64, 900);
  ctx.fillText(String(club.name).toUpperCase(), 240, 164);

  const chip = (text: string, x: number, y: number, fill: string, color: string) => {
    ctx.font = `800 20px ${FONT}`;
    const w = ctx.measureText(text).width + 36;
    roundRect(ctx, x, y, w, 42, 21);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(text, x + 18, y + 28);
    return x + w + 12;
  };
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  let cx = 240;
  cx = chip(`${players.length}/${opts.limit || 30} PLAYERS`, cx, 186, gold, "#0B0C0F");
  cx = chip(`UPDATED ${today.toUpperCase()}`, cx, 186, "rgba(255,255,255,0.1)", "#fff");
  if (club.shortName) chip(String(club.shortName).toUpperCase(), cx, 186, "rgba(255,255,255,0.1)", "#fff");

  // note bar
  ctx.fillStyle = "rgba(232,185,90,0.14)";
  ctx.fillRect(0, HEADER - 66, W, 66);
  ctx.fillStyle = "#F7DC8B";
  ctx.font = `700 21px ${FONT}`;
  ctx.fillText(
    opts.includePhone
      ? "Please check your details. Wrong or missing name, UID, phone or device? Tell your club manager."
      : "Please check your details. Wrong name, UID or device? Tell your club manager.",
    56,
    HEADER - 26
  );

  // ---- column headings
  const X = { seat: 40, avatar: 118, name: 206, uid: 640, device: 880, pos: 1120, contract: 1200 };
  ctx.fillStyle = "#0B0C0F";
  ctx.fillRect(0, HEADER, W, COLS);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `800 16px ${FONT}`;
  const head: [string, number][] = [
    ["SEAT", X.seat],
    ["PLAYER", X.name],
    ["KONAMI UID", X.uid],
    ["DEVICE", X.device],
    ["POS", X.pos],
    ["CONTRACT", X.contract],
  ];
  if (opts.includePhone) head[2] = ["KONAMI UID / PHONE", X.uid];
  for (const [t, x] of head) ctx.fillText(t, x, HEADER + 36);

  // ---- rows
  const DAY = 86400000;
  players.forEach((p, i) => {
    const y = HEADER + COLS + i * ROW;
    ctx.fillStyle = i % 2 ? "#F8FAFC" : "#FFFFFF";
    ctx.fillRect(0, y, W, ROW);
    ctx.fillStyle = "#E2E8F0";
    ctx.fillRect(0, y + ROW - 1, W, 1);
    const mid = y + ROW / 2;

    // seat badge
    ctx.save();
    ctx.beginPath();
    ctx.arc(X.seat + 30, mid, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#0B0C0F";
    ctx.fill();
    ctx.fillStyle = gold;
    ctx.font = `900 22px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText(p.seat ? String(p.seat).padStart(2, "0") : "-", X.seat + 30, mid + 8);
    ctx.restore();

    drawAvatar(ctx, (avatars[i] as HTMLImageElement | null) || null, String(p.fullName || "?"), X.avatar, mid - 34, 68);

    // name (+ shirt) and username
    ctx.fillStyle = "#0B0C0F";
    ctx.font = `900 25px ${FONT}`;
    const shirt = p.shirtNo ? `#${p.shirtNo}` : "";
    const name = ellipsize(ctx, String(p.fullName || ""), X.uid - X.name - 30 - (shirt ? 64 : 0));
    ctx.fillText(name, X.name, mid - 6);
    if (shirt) {
      const nw = ctx.measureText(name).width;
      ctx.fillStyle = "#8a6420";
      ctx.font = `900 20px ${MONO}`;
      ctx.fillText(shirt, X.name + nw + 12, mid - 6);
    }
    ctx.fillStyle = "#64748B";
    ctx.font = `600 18px ${MONO}`;
    ctx.fillText(ellipsize(ctx, `@${p.username || ""}`, X.uid - X.name - 30), X.name, mid + 24);

    // UID (+ phone)
    const withPhone = !!opts.includePhone;
    ctx.fillStyle = p.konamiId ? "#0F172A" : "#CBD5E1";
    ctx.font = `800 20px ${MONO}`;
    ctx.fillText(ellipsize(ctx, p.konamiId || "missing", X.device - X.uid - 20), X.uid, withPhone ? mid - 6 : mid + 7);
    if (withPhone) {
      // Shown for everyone when phones are included, so players without one know to add it.
      ctx.fillStyle = p.phone ? "#334155" : "#E11D48";
      ctx.font = `700 17px ${MONO}`;
      ctx.fillText(ellipsize(ctx, `Tel ${p.phone || "missing"}`, X.device - X.uid - 20), X.uid, mid + 24);
    }

    // device
    ctx.fillStyle = p.deviceModel ? "#334155" : "#CBD5E1";
    ctx.font = `700 19px ${FONT}`;
    ctx.fillText(ellipsize(ctx, p.deviceModel || "missing", X.pos - X.device - 18), X.device, mid + 7);

    // position chip
    if (p.preferredPosition) {
      ctx.font = `900 17px ${FONT}`;
      const pw = ctx.measureText(p.preferredPosition).width + 20;
      roundRect(ctx, X.pos, mid - 17, pw, 34, 9);
      ctx.fillStyle = "#0B0C0F";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(p.preferredPosition, X.pos + 10, mid + 6);
    }

    // contract
    const end = p.contract?.endDate ? new Date(p.contract.endDate) : null;
    if (end) {
      const left = Math.max(0, Math.ceil((end.getTime() - Date.now()) / DAY));
      ctx.fillStyle = left <= 7 ? "#BE123C" : left <= 30 ? "#B45309" : "#047857";
      ctx.font = `900 21px ${FONT}`;
      ctx.fillText(`${left}d left`, X.contract, mid - 4);
      ctx.fillStyle = "#94A3B8";
      ctx.font = `600 15px ${FONT}`;
      ctx.fillText(`ends ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`, X.contract, mid + 20);
    } else {
      ctx.fillStyle = "#CBD5E1";
      ctx.font = `700 18px ${FONT}`;
      ctx.fillText("-", X.contract, mid + 6);
    }
  });
  if (!players.length) {
    ctx.fillStyle = "#64748B";
    ctx.font = `700 22px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("No players in the squad yet.", W / 2, HEADER + COLS + ROW / 2 + 8);
    ctx.textAlign = "left";
  }

  // ---- footer
  const fy = H - FOOT;
  ctx.fillStyle = "#0B0C0F";
  ctx.fillRect(0, fy, W, FOOT);
  ctx.fillStyle = gold;
  ctx.fillRect(0, fy, W, 4);
  ctx.fillStyle = "#fff";
  ctx.font = `900 26px ${FONT}`;
  ctx.fillText("NECOB", 56, fy + 66);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText("National eFootball Community of Bangladesh", 160, fy + 64);
  ctx.textAlign = "right";
  ctx.fillStyle = gold;
  ctx.font = `800 20px ${FONT}`;
  ctx.fillText(opts.site || "necobbd.com", W - 56, fy + 64);
  ctx.textAlign = "left";
}
