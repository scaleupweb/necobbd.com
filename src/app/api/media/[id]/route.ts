import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await db.getMedia(id).catch(() => null);
  if (!media) return new NextResponse("Not found", { status: 404 });
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
