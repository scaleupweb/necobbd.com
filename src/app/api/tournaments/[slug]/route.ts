import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const t = await db.getTournamentBySlug(slug);
  if (!t) return fail("Tournament not found", 404, "NOT_FOUND");
  const participants = (t.participants || []).map(({ phone, userId, ...p }: any) => p);
  return ok({ ...t, participants });
});
