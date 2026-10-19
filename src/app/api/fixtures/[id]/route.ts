import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const fixture = await db.getFixtureById(id);
  if (!fixture) return fail("Fixture not found", 404, "NOT_FOUND");
  return ok(fixture);
});
