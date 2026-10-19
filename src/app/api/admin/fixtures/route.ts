import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, STAFF_ROLES, TOURNAMENT_STAFF } from "@/lib/auth";
import { FixtureCreateSchema } from "@/lib/validation";
import { ok, handle, parseBody, audit } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  await requireRole(STAFF_ROLES);
  const sp = req.nextUrl.searchParams;
  return ok(await db.getFixtures({ status: sp.get("status") || undefined, tournamentId: sp.get("tournamentId") || undefined }));
});

export const POST = handle(async (req: NextRequest) => {
  const session = await requireRole(TOURNAMENT_STAFF);
  const data = await parseBody(req, FixtureCreateSchema);
  const fixture = await db.createFixture(data);
  const label = `${fixture.homePlayer?.fullName || fixture.homeClub?.name} vs ${fixture.awayPlayer?.fullName || fixture.awayClub?.name}`;
  await audit(req, session, "CREATED_FIXTURE", label);
  for (const p of [fixture.homePlayer, fixture.awayPlayer]) {
    if (!p) continue;
    const pl = await db.getPlayerById(p.id);
    if (pl?.userId) await db.notify(String(pl.userId), "New match scheduled", `${label} — ${new Date(fixture.scheduledDate).toUTCString()}`, `/matches/${fixture.id}`);
  }
  return ok(fixture, 201);
});
