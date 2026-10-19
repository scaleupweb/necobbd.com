import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, fail, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/** The club's full transfer history plus its open/closed transfer requests. */
export const GET = handle(async () => {
  const session = await requireAuth();
  const clubId = await db.getEditableClubId(session.id);
  if (!clubId || !(await db.canUseClubTool(session.id, clubId, "transfer-history"))) return fail("You don't have access to the transfer history", 403, "FORBIDDEN");
  const [history, requests] = await Promise.all([db.getClubTransferLog(clubId), db.getTransferRequests()]);
  return ok({ history, requests: requests.filter((r: any) => r.club?.id === clubId) });
});
