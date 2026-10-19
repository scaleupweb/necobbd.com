import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const category = req.nextUrl.searchParams.get("category") || undefined;
  return ok(await db.getActivityEvents(category, 100));
});
