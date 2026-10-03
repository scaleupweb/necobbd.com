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
  const [{ access, permissions }, fixtures, requests] = await Promise.all([
    db.getClubPermissions(session.id, club.id),
    db.getFixtures({ clubId: club.id, limit: 20 }),
    db.getTransferRequests(),
  ]);
  const isManager = access === "MANAGER" || access === "FULL";
  const can = (tool: string) => isManager || (access === "CUSTOM" && permissions.includes(tool));
  return ok({
    ...club,
    staff: undefined,
    squad: club.squad.map(({ phone, ...p }: any) => p),
    access,
    permissions,
    isManager,
    canEdit: can("change-info") || can("change-logo"),
    fixtures,
    offers: can("transfer-history") ? requests.filter((r: any) => r.targetClubId === club.id) : [],
  });
});

/** Club manager or club moderator updates the club's public profile (logo, cover, slogan…). */
export const PATCH = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `club-edit:${session.id}`, 60, 60 * 60 * 1000);
  const clubId = await db.getEditableClubId(session.id, session.clubId);
  if (!clubId) return fail("You are not attached to a club", 404, "NOT_FOUND");
  const raw = await req.json();
  const data = onlySent(ClubSelfUpdateSchema.parse(raw), raw);
  // Logo/cover need "Change Logo"; everything else needs "Change Info".
  const keys = Object.keys(data);
  const needsLogo = keys.some((k) => k === "logo" || k === "banner");
  const needsInfo = keys.some((k) => k !== "logo" && k !== "banner");
  if ((needsLogo && !(await db.canUseClubTool(session.id, clubId, "change-logo"))) || (needsInfo && !(await db.canUseClubTool(session.id, clubId, "change-info")))) {
    return fail("You don't have access to change this", 403, "FORBIDDEN");
  }
  return ok(await db.updateClubProfile(clubId, data));
});
