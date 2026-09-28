import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, handle, limit } from "@/lib/api";

export const POST = handle(async (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  const session = await requireAuth();
  limit(req, `event:${session.id}`, 30, 60 * 60 * 1000);
  const { slug } = await params;
  const e = await db.registerForEvent(slug, session.id);
  return ok({ registeredCount: e.registeredCount, registered: true });
});

export const DELETE = handle(async (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  const session = await requireAuth();
  limit(req, `event:${session.id}`, 30, 60 * 60 * 1000);
  const { slug } = await params;
  const e = await db.unregisterFromEvent(slug, session.id);
  return ok({ registeredCount: e.registeredCount, registered: false });
});
