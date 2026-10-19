import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { r2Enabled, r2PublicUrl, mediaKey } from "@/lib/r2";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await db.getMedia(id).catch(() => null);
  if (!media) {
    // Images moved to Cloudflare R2 keep their old /api/media/<id> links working.
    if (r2Enabled() && /^[a-f0-9]{24}$/i.test(id)) {
      return NextResponse.redirect(r2PublicUrl(mediaKey(id)), { status: 308, headers: { "Cache-Control": "public, max-age=31536000, immutable" } });
    }
    return new NextResponse("Not found", { status: 404 });
  }
  const data: Buffer = Buffer.isBuffer(media.data) ? media.data : Buffer.from(media.data.buffer ?? media.data);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": media.contentType,
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
