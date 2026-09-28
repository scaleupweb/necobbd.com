import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, DISCIPLINE_STAFF } from "@/lib/auth";
import { ok, handle, audit } from "@/lib/api";

/** Revokes a sanction and restores the target's status if nothing else is active. */
export const DELETE = handle(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireRole(DISCIPLINE_STAFF);
  const rec = await db.revokeDisciplinary(id);
  await audit(req, session, "REVOKED_SANCTION", rec.targetName);
  return ok(rec);
});
