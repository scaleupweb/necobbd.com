import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Public player profile: stats, matches, tournaments, events and activity timeline. */
export const GET = handle(async (_req: NextRequest, { params }: { params: Promise<{ username: string }> }) => {
  const { username } = await params;
  const player = await db.getPlayerByUsername(username);
  if (!player) return fail("Player not found", 404, "NOT_FOUND");

  const userId = player.userId ? String(player.userId) : "";
  const [fixtures, tournaments, events, activity] = await Promise.all([
    db.getFixtures({ playerId: player.id, limit: 50 }),
    userId ? db.getTournamentsForUser(userId) : [],
    userId ? db.getEventsForUser(userId) : [],
    db.getActivityForUser(userId, player.id, 40),
  ]);

  const { phone, ...publicPlayer } = player as any;
  return ok({
    ...publicPlayer,
    fixtures,
    tournaments,
    events: events.map((e: any) => ({ id: e.id, name: e.name, slug: e.slug, eventDate: e.eventDate, venue: e.venue, banner: e.banner, status: e.status })),
    activity,
  });
});
