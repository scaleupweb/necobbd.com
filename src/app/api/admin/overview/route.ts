import { db } from "@/lib/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { ok, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const session = await requireRole(STAFF_ROLES);
  const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
  const [insights, stats, auditLogs, upcoming, liveFixtures, pendingResults, settings, recentUsers] = await Promise.all([
    db.getAdminInsights(),
    db.getPlatformStats(),
    isAdmin ? db.getAuditLogs(8) : [],
    db.getFixtures({ status: "SCHEDULED", limit: 200 }),
    db.getFixtures({ status: "LIVE" }),
    db.getPendingResultClaims(),
    db.getSiteSettings(),
    isAdmin ? db.listUsers({}) : [],
  ]);
  return ok({
    insights,
    isAdmin,
    stats,
    auditLogs,
    pendingFixtures: upcoming.sort((a: any, b: any) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate)).slice(0, 8),
    liveFixtures,
    pendingResults,
    countdown: settings.countdown,
    recentUsers: recentUsers.slice(0, 6),
  });
});
