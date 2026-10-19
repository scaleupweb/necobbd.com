import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { TransferRequestSchema } from "@/lib/validation";
import { ok, fail, handle, parseBody, limit } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const [listings, history, feed, settings] = await Promise.all([db.getTransferListings(), db.getTransferHistory(), db.getTransferFeed(), db.getSiteSettings()]);
  return ok({
    listings,
    history,
    feed,
    windowStatus: { isOpen: settings.sections.transfers.show, name: settings.sections.transfers.title },
  });
});

/** Club managers make offers for players on behalf of their own club. */
export const POST = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `transfer:${session.id}`, 20, 60 * 60 * 1000);
  const data = await parseBody(req, TransferRequestSchema);

  const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
  if (!isAdmin && !(await db.canManageClub(session.id, data.targetClubId))) {
    return fail("Only the manager of the bidding club can make an offer", 403, "FORBIDDEN");
  }

  const request = await db.createTransferRequest({ ...data, requesterUserId: session.id });
  return ok(request, 201);
});
