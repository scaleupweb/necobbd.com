import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ClubSelfUpdateSchema } from "@/lib/validation";
import { onlySent } from "@/lib/admin-resources";
import { ok, fail, handle, limit } from "@/lib/api";

export const dynamic = "force-dynamic";

/** The club the signed-in user manages (or plays for), plus what they may do with it. */
export const GET = handle(async () => {
  const session = await requireAuth();
  const clubId = await db.getEditableClubId(session.id, session.clubId);
  if (!clubId) return fail("You are not attached to a club", 404, "NOT_FOUND");
  const club = await db.getClubById(clubId);
  if (!club) return fail("Club not found", 404, "NOT_FOUND");
  const [access, fixtures, requests] = await Promise.all([
    db.getClubAccess(session.id, club.id),
    db.getFixtures({ clubId: club.id, limit: 20 }),
    db.getTransferRequests(),
  ]);
  const isManager = access === "MANAGER" || access === "FULL";
  return ok({
    ...club,
    squad: club.squad.map(({ phone, ...p }: any) => p),
    access,
    isManager,
    canEdit: !!access,
    fixtures,
    offers: isManager ? requests.filter((r: any) => r.targetClubId === club.id) : [],
  });
});

/** Club manager or club moderator updates the club's public profile (logo, cover, slogan…). */
export const PATCH = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `club-edit:${session.id}`, 60, 60 * 60 * 1000);
  const clubId = await db.getEditableClubId(session.id, session.clubId);
  if (!clubId || !(await db.getClubAccess(session.id, clubId))) {
    return fail("Only the club manager or a club moderator can edit this club", 403, "FORBIDDEN");
  }
  const raw = await req.json();
  const data = onlySent(ClubSelfUpdateSchema.parse(raw), raw);
  return ok(await db.updateClubProfile(clubId, data));
});
