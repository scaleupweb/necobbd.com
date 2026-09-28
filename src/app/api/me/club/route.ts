import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, fail, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/** The signed-in user's club (managers see offers they've made too). */
export const GET = handle(async () => {
  const session = await requireAuth();
  if (!session.clubId) return fail("You are not attached to a club", 404, "NOT_FOUND");
  const club = await db.getClubById(session.clubId);
  if (!club) return fail("Club not found", 404, "NOT_FOUND");
  const [fixtures, requests] = await Promise.all([
    db.getFixtures({ clubId: club.id, limit: 20 }),
    session.role === "CLUB_MANAGER" ? db.getTransferRequests() : Promise.resolve([]),
  ]);
  return ok({
    ...club,
    squad: club.squad.map(({ phone, ...p }: any) => p),
    isManager: club.managerId === session.id,
    fixtures,
    offers: requests.filter((r: any) => r.targetClubId === club.id),
  });
});
