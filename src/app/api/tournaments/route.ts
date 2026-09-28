import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get("status") || undefined;
  return ok(await db.getTournaments({ status }));
});
