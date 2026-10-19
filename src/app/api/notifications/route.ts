import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const session = await requireAuth();
  return ok(await db.getNotifications(session.id));
});

/** Marks every notification as read. */
export const POST = handle(async () => {
  const session = await requireAuth();
  await db.markNotificationsRead(session.id);
  return ok({ read: true });
});
