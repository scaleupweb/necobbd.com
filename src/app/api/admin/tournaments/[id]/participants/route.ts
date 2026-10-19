import { NextRequest } from "next/server";
import { db, isId } from "@/lib/db";
import { requireRole, TOURNAMENT_STAFF } from "@/lib/auth";
import { ok, fail, handle, audit } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  await requireRole(TOURNAMENT_STAFF);
  return ok(await db.getTournamentParticipantsAdmin(id));
});

/** body: { userId, action: "REMOVE" | "RESTORE" } or { clubId, action: "APPROVE" | "REJECT" | "REMOVE" | "RESTORE" } */
export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const session = await requireRole(TOURNAMENT_STAFF);
  const { userId, clubId, action } = await req.json();
  if (clubId) {
    // APPROVE/RESTORE confirm the entry; REJECT/REMOVE take it out.
    if (!isId(clubId) || !["APPROVE", "REJECT", "REMOVE", "RESTORE"].includes(action)) return fail("Invalid request");
    await db.setClubEntryStatus(id, clubId, action === "REMOVE" || action === "REJECT" ? "REMOVED" : "CONFIRMED");
    await audit(req, session, `CLUB_ENTRY_${action}`, `Tournament ${id}`, `club ${clubId}`);
    return ok(await db.getTournamentParticipantsAdmin(id));
  }
  if (!isId(userId)) return fail("Invalid user");
  if (action === "REMOVE") await db.removeTournamentParticipant(id, userId);
  else if (action === "RESTORE") await db.restoreTournamentParticipant(id, userId);
  else return fail("Invalid action");
  await audit(req, session, `PARTICIPANT_${action}`, `Tournament ${id}`, `user ${userId}`);
  return ok(await db.getTournamentParticipantsAdmin(id));
});
