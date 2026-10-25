import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, handle, limit } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** Public match centre data for a competition match. */
export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const data = await db.getMatchCenter(id);
  return data ? ok(data) : fail("Match not found", 404, "NOT_FOUND");
});

/** body: { code } — the captains' view (chat link, phone numbers, submitted result). */
export const POST = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  limit(req, "match-code", 12, 10 * 60 * 1000);
  const { code } = (await req.json().catch(() => ({}))) || {};
  return ok(await db.unlockMatch(id, String(code || "")));
});
