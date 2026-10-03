import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, data: null });
  }
  const [unread, owned, manageable] = await Promise.all([
    db.unreadNotificationCount(session.id).catch(() => 0),
    db.getMainManagedClub(session.id).catch(() => null),
    db.getEditableClubId(session.id).catch(() => undefined),
  ]);
  return NextResponse.json({
    success: true,
    data: {
      ...session,
      unreadNotifications: unread,
      // Club this user owns as main manager (only they can register it for tournaments).
      managedClub: owned ? { id: String(owned._id), name: owned.name, status: owned.status } : null,
      // Club this user can open in My Club (main manager or club staff) — works from a player account too.
      canManageClubId: manageable || null,
    },
  });
}
