import { db } from "@/lib/db";
import { requireRole, ADMIN_ONLY } from "@/lib/auth";
import { ok, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireRole(ADMIN_ONLY);
  return ok(await db.getAuditLogs());
});
