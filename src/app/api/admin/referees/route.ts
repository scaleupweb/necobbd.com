import { db } from "@/lib/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { ok, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

// Read-only list for staff (e.g. assigning referees to fixtures).
// Creating/editing officials goes through /api/admin/resources/referees.
export const GET = handle(async () => {
  await requireRole(STAFF_ROLES);
  return ok(await db.getReferees());
});
