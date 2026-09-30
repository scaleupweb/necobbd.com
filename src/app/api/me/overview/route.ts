import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Everything the player dashboard needs in one request. */
export const GET = handle(async () => {
  const session = await requireAuth();
  const player = await db.getPlayerByUserId(session.id);
  const [tournaments, events, fixtures, activity, notifications, openTournaments] = await Promise.all([
    db.getTournamentsForUser(session.id),
    db.getEventsForUser(session.id),
    player ? db.getFixtures({ playerId: player.id, limit: 30 }) : [],
    db.getActivityForUser(session.id, player?.id, 30),
    db.getNotifications(session.id),
    db.getTournaments({ status: "REGISTRATION_OPEN" }),
  ]);
  const managed = await db.getManagedClub(session.id);
  return ok({
    managedClub: managed ? { name: managed.name, slug: managed.slug, status: managed.status, logo: managed.logo } : null,
    user: session,
    player,
    tournaments,
    events,
    fixtures,
    activity,
    notifications: notifications.slice(0, 10),
    openTournaments: openTournaments.filter((t: any) => t.isRegistrationOpen && !t.participantUserIds.includes(session.id)).slice(0, 4),
  });
});
