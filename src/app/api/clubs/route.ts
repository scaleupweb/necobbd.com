import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { publicClub } from "@/lib/public";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const search = req.nextUrl.searchParams.get("search") || undefined;
  return ok((await db.getClubs({ search, status: "ACTIVE" })).map(publicClub));
});
