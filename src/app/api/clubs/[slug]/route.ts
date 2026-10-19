import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { publicClub } from "@/lib/public";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const club = await db.getClubBySlug(slug);
  if (!club) return fail("Club not found", 404, "NOT_FOUND");
  const fixtures = await db.getFixtures({ clubId: club.id, limit: 50 });
  return ok({ ...publicClub(club), fixtures });
});
