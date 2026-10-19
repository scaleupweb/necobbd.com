import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, fail, handle, parseBody, audit, limit } from "@/lib/api";
import { facebookPostLink } from "@/lib/validation";

const Schema = z.object({
  playerId: z.string().regex(/^[a-f0-9]{24}$/i, "Pick a player"),
  squad: z.string().min(1).max(20),
  seat: z.coerce.number().int(),
  postLink: facebookPostLink,
});

async function clubFor(userId: string) {
  const clubId = await db.getEditableClubId(userId);
  if (!clubId || !(await db.canUseClubTool(userId, clubId, "transfer-window"))) return null;
  return clubId;
}

/** This club's Transfer Window signing requests. */
export const GET = handle(async () => {
  const session = await requireAuth();
  const clubId = await clubFor(session.id);
  if (!clubId) return fail("You don't have access to the transfer window", 403, "FORBIDDEN");
  const all = await db.getTransferRequests();
  return ok(all.filter((r: any) => r.type === "SIGNING" && r.club?.id === clubId));
});

/** Ask the admins to approve signing a free agent into a squad seat. */
export const POST = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `transfer-request:${session.id}`, 30, 60 * 60 * 1000);
  const data = await parseBody(req, Schema);
  const clubId = await clubFor(session.id);
  if (!clubId) return fail("You don't have access to the transfer window", 403, "FORBIDDEN");
  const r = await db.createSigningRequest({ clubId, playerId: data.playerId, squad: data.squad, seat: data.seat, postLink: data.postLink, requesterUserId: session.id });
  await audit(req, session, "TRANSFER_SIGNING_REQUESTED", `Club ${clubId}`, `${data.playerId} · seat ${data.seat}`);
  return ok(r, 201);
});
