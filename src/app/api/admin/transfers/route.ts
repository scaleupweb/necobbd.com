import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, ADMIN_ONLY } from "@/lib/auth";
import { ok, handle, audit } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireRole(ADMIN_ONLY);
  const [listings, history, clubs, requests] = await Promise.all([
    db.getTransferListings(),
    db.getTransferHistory(),
    db.getClubs(),
    db.getTransferRequests(),
  ]);
  return ok({ listings, history, clubs, requests });
});

const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("APPROVE"), listingId: z.string(), buyerClubId: z.string() }),
  z.object({ action: z.literal("LIST"), playerId: z.string(), askingPrice: z.coerce.number().min(0).max(100000) }),
  z.object({ action: z.literal("CLOSE"), listingId: z.string() }),
]);

export const POST = handle(async (req: NextRequest) => {
  const session = await requireRole(ADMIN_ONLY);
  const body = ActionSchema.parse(await req.json());

  if (body.action === "APPROVE") {
    const record = await db.approveTransfer(body.listingId, body.buyerClubId, session.fullName);
    await audit(req, session, "APPROVED_TRANSFER", record.playerName, `${record.previousClubName} -> ${record.newClubName}`);
    return ok(record);
  }
  if (body.action === "LIST") {
    const listing = await db.createTransferListing({ playerId: body.playerId, askingPrice: body.askingPrice, listedBy: session.id });
    await audit(req, session, "LISTED_PLAYER", body.playerId, `$${body.askingPrice}M`);
    return ok(listing);
  }
  await db.closeTransferListing(body.listingId);
  await audit(req, session, "CLOSED_LISTING", body.listingId);
  return ok({ closed: true });
});
