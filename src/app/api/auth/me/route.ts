import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, setSessionCookie } from "@/lib/auth";
import { COOKIE_NAME, verifyToken } from "@/lib/auth/token";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, data: null });
  }
  // If an admin changed this account's role, refresh the cookie so pages gated by the proxy
  // (e.g. /admin) follow the new role without signing out and back in.
  const payload = await verifyToken((await cookies()).get(COOKIE_NAME)?.value || "");
  if (payload && payload.role !== session.role) {
    const user = await db.getUserById(session.id);
    if (user) await setSessionCookie(user);
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
