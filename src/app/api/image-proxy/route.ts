import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Serves an image from our own origin so the browser lets a <canvas> read it (transfer cards,
 * squad sheets, player cards). Photos live on Cloudflare R2, which only allows canvas use when the
 * bucket has a CORS rule; this route works either way. Only trusted image hosts are allowed.
 */
const MAX_BYTES = 8 * 1024 * 1024;

function allowedHosts() {
  const hosts = new Set(["lh3.googleusercontent.com", "drive.google.com", "drive.usercontent.google.com"]);
  try {
    const r2 = (process.env.R2_PUBLIC_URL || "").trim().replace(/^["']|["']$/g, "");
    if (r2) hosts.add(new URL(r2).hostname);
  } catch {
    /* ignore a malformed R2_PUBLIC_URL */
  }
  return hosts;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("src") || "";
  // Our own /api/media/<id> links (they may redirect to R2) are allowed as relative paths.
  const ownMedia = /^\/api\/media\/[a-f0-9]{24}$/i.test(raw);
  let url: URL;
  try {
    url = ownMedia ? new URL(raw, req.nextUrl.origin) : new URL(raw);
  } catch {
    return new NextResponse("Bad image URL", { status: 400 });
  }
  const host = url.hostname.toLowerCase();
  const trusted = ownMedia || (url.protocol === "https:" && (allowedHosts().has(host) || host.endsWith(".r2.dev")));
  if (!trusted) return new NextResponse("Image host not allowed", { status: 403 });

  const res = await fetch(url, { redirect: "follow", cache: "force-cache" }).catch(() => null);
  if (!res || !res.ok) return new NextResponse("Image not found", { status: 404 });
  const type = res.headers.get("content-type") || "";
  if (!/^image\/(png|jpe?g|webp|gif|avif)/i.test(type)) return new NextResponse("Not an image", { status: 415 });
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) return new NextResponse("Image too large", { status: 413 });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(buf.byteLength),
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
