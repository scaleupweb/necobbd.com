import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, data: null });
  }
  const unread = await db.unreadNotificationCount(session.id).catch(() => 0);
  return NextResponse.json({ success: true, data: { ...session, unreadNotifications: unread } });
}
