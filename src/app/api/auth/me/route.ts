import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, data: null });
  }
  const [unread, owned] = await Promise.all([
    db.unreadNotificationCount(session.id).catch(() => 0),
    db.getMainManagedClub(session.id).catch(() => null),
  ]);
  return NextResponse.json({
    success: true,
    data: {
      ...session,
      unreadNotifications: unread,
      // Club this user owns as main manager (only they can register it for tournaments).
      managedClub: owned ? { id: String(owned._id), name: owned.name, status: owned.status } : null,
    },
  });
}
