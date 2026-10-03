import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, fail, handle, parseBody, audit, limit } from "@/lib/api";
import { GRANTABLE_TOOL_SLUGS } from "@/components/club-hub/tools";

const Schema = z.object({
  playerId: z.string().regex(/^[a-f0-9]{24}$/i, "Pick a player"),
  access: z.enum(["full_control", "custom"]),
  permissions: z.array(z.enum(GRANTABLE_TOOL_SLUGS as [string, ...string[]])).max(50).default([]),
});

/** Only the main manager and full-control staff manage club access. */
async function managerClub(userId: string) {
  const clubId = await db.getEditableClubId(userId);
  if (!clubId) return null;
  const access = await db.getClubAccess(userId, clubId);
  return access === "MANAGER" || access === "FULL" ? clubId : null;
}

export const GET = handle(async () => {
  const session = await requireAuth();
  const clubId = await managerClub(session.id);
  if (!clubId) return fail("Only the club manager can manage access", 403, "FORBIDDEN");
  return ok(await db.getClubStaff(clubId));
});

/** Grant or update a squad player's access. */
export const POST = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `club-staff:${session.id}`, 60, 60 * 60 * 1000);
  const data = await parseBody(req, Schema);
  const clubId = await managerClub(session.id);
  if (!clubId) return fail("Only the club manager can manage access", 403, "FORBIDDEN");
  const staff = await db.setClubStaff(clubId, data.playerId, data.access, [...new Set(data.permissions)]);
  await audit(req, session, "CLUB_STAFF_GRANTED", `Club ${clubId}`, `${data.playerId} · ${data.access} ${data.permissions.join(",")}`);
  return ok(staff);
});

/** Revoke a staff member's access (?userId=). */
export const DELETE = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  const userId = req.nextUrl.searchParams.get("userId") || "";
  const clubId = await managerClub(session.id);
  if (!clubId) return fail("Only the club manager can manage access", 403, "FORBIDDEN");
  const staff = await db.removeClubStaff(clubId, userId);
  await audit(req, session, "CLUB_STAFF_REVOKED", `Club ${clubId}`, userId);
  return ok(staff);
});
