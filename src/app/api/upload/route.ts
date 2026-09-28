import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, fail, handle, limit } from "@/lib/api";

const MAX_BYTES = 3 * 1024 * 1024;

// Detect type from the file's own bytes; the browser-supplied type can't be trusted.
function sniff(buf: Buffer): string | null {
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 6 && buf.subarray(0, 6).toString("ascii").startsWith("GIF8")) return "image/gif";
  if (buf.length > 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export const POST = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `upload:${session.id}`, 40, 60 * 60 * 1000);

  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return fail("No file uploaded");
  if (file.size > MAX_BYTES) return fail("Image must be 3 MB or smaller", 413);

  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) return fail("Only PNG, JPEG, WEBP or GIF images are allowed", 415);

  const id = await db.saveMedia(buf, type, (file.name || "image").slice(0, 120), session.id);
  return ok({ url: `/api/media/${id}` }, 201);
});
