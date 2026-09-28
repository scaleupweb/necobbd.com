import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, ADMIN_ONLY } from "@/lib/auth";
import { ok, handle, audit } from "@/lib/api";

const Body = z.object({ status: z.enum(["ACCEPTED", "REJECTED"]) });

export const PATCH = handle(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireRole(ADMIN_ONLY);
  const { status } = Body.parse(await req.json());
  const r = await db.setTransferRequestStatus(id, status, session.fullName);
  await audit(req, session, `TRANSFER_OFFER_${status}`, id);
  return ok(r);
});
