import { NextRequest } from "next/server";
import { db, isId } from "@/lib/db";
import { requireRole, TOURNAMENT_STAFF } from "@/lib/auth";
import { ok, fail, handle, audit } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  await requireRole(TOURNAMENT_STAFF);
  return ok(await db.getEventRegistrationsAdmin(id));
});

export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(TOURNAMENT_STAFF);
  const userId = req.nextUrl.searchParams.get("userId") || "";
  if (!isId(userId)) return fail("Invalid user");
  await db.removeEventRegistration(id, userId);
  await audit(req, session, "REMOVED_EVENT_REGISTRATION", `Event ${id}`, `user ${userId}`);
  return ok(await db.getEventRegistrationsAdmin(id));
});
