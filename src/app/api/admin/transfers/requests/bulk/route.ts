import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, ADMIN_ONLY } from "@/lib/auth";
import { ok, handle, parseBody, audit, limit } from "@/lib/api";

const Body = z.object({
  ids: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).min(1).max(100),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

/**
 * Approve or reject several transfer requests at once. They run one after another
 * (oldest first) so seat and squad-size checks stay correct; each gets its own result.
 */
export const POST = handle(async (req: NextRequest) => {
  const session = await requireRole(ADMIN_ONLY);
  limit(req, `transfer-bulk:${session.id}`, 30, 60 * 60 * 1000);
  const { ids, status } = await parseBody(req, Body);

  const all = await db.getTransferRequests({ status: "PENDING" });
  const order = new Map(all.map((r: any, i: number) => [r.id, -i])); // list is newest first
  const queue = [...new Set(ids)].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const id of queue) {
    try {
      await db.setTransferRequestStatus(id, status, session.fullName);
      results.push({ id, ok: true });
    } catch (e: any) {
      results.push({ id, ok: false, error: e?.message || "Failed" });
    }
  }
  const done = results.filter((r) => r.ok).length;
  await audit(req, session, `TRANSFER_BULK_${status}`, `${done}/${results.length} requests`, queue.join(","));
  return ok({ done, failed: results.length - done, results });
});
