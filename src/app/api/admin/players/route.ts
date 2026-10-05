import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ADMIN_ONLY } from "@/lib/auth";
import { ok, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Admin player list. Admins also get the account email and can search by email / phone. */
export const GET = handle(async (req: NextRequest) => {
  const session = await requireRole(["ADMIN", "MODERATOR"]);
  const isAdmin = ADMIN_ONLY.includes(session.role);
  const sp = req.nextUrl.searchParams;
  const players = await db.getPlayers({ search: sp.get("search") || undefined, status: "ALL", searchEmail: isAdmin });
  if (!isAdmin) return ok(players.map(({ phone, ...p }: any) => p));
  const accounts = await db.getAccountsByIds(players.map((p: any) => p.userId));
  return ok(players.map((p: any) => ({ ...p, account: accounts.get(String(p.userId)) || null })));
});
