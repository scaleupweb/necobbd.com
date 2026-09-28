import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { db, isId } from "@/lib/db";
import { requireRole, ADMIN_ONLY, TOURNAMENT_STAFF } from "@/lib/auth";
import { DEFAULT_SITE_SETTINGS, mergeSettings, SiteSettings } from "@/lib/site-settings";
import { imageUrl, safeLink } from "@/lib/validation";
import { ok, fail, handle, audit } from "@/lib/api";

export const dynamic = "force-dynamic";

const IMAGE_KEYS = new Set(["image", "logoUrl", "promoImage"]);
const LINK_KEYS = /(Href|^facebook$|^x$|^youtube$|^instagram$|^discord$)$/;

/** Validates every string: max length, and image/link fields must be safe URLs. */
function validate(obj: any, path: string[] = []): string | null {
  for (const [k, v] of Object.entries(obj)) {
    const p = [...path, k];
    if (v && typeof v === "object") {
      const e = validate(v, p);
      if (e) return e;
    } else if (typeof v === "string") {
      if (v.length > 10000) return `${p.join(".")} is too long`;
      if (IMAGE_KEYS.has(k) && !imageUrl.safeParse(v).success) return `${p.join(".")} must be an uploaded image or http(s) URL`;
      if (LINK_KEYS.test(k) && !safeLink.safeParse(v).success) return `${p.join(".")} is not a valid link`;
    }
  }
  return null;
}

export const GET = handle(async () => {
  await requireRole(TOURNAMENT_STAFF);
  return ok(await db.getSiteSettings());
});

/**
 * Full replace for admins. Tournament staff may only update the `countdown`
 * block (so they can run registration countdowns without editing site copy).
 */
export const PUT = handle(async (req: NextRequest) => {
  const session = await requireRole(TOURNAMENT_STAFF);
  const body = await req.json();
  const isAdmin = (ADMIN_ONLY as string[]).includes(session.role);

  const current = await db.getSiteSettings();
  const incoming: SiteSettings = isAdmin
    ? mergeSettings(DEFAULT_SITE_SETTINGS, body)
    : { ...current, countdown: mergeSettings(DEFAULT_SITE_SETTINGS.countdown, body?.countdown) };

  const err = validate(incoming);
  if (err) return fail(err, 400, "VALIDATION_ERROR");

  const c = incoming.countdown;
  if (c.enabled && (!c.targetDate || isNaN(new Date(c.targetDate).getTime()))) {
    return fail("Set a valid countdown end date/time before turning it on", 400, "VALIDATION_ERROR");
  }
  if (c.tournamentId && !isId(c.tournamentId)) c.tournamentId = "";

  // Linking the countdown to a tournament keeps its registration status in sync.
  if (c.tournamentId && JSON.stringify(c) !== JSON.stringify(current.countdown)) {
    const t = await db.getTournamentById(c.tournamentId);
    if (t) {
      const patch: any = {};
      if (c.targetDate) patch.registrationDeadline = new Date(c.targetDate);
      if (c.enabled && t.status !== "ONGOING" && t.status !== "COMPLETED") patch.status = "REGISTRATION_OPEN";
      if (!c.enabled && current.countdown.enabled && t.status === "REGISTRATION_OPEN") patch.status = "REGISTRATION_CLOSED";
      if (Object.keys(patch).length) await db.updateTournament(c.tournamentId, patch);
      if (!c.ctaHref || c.ctaHref === "/tournaments") c.ctaHref = `/tournaments/${t.slug}`;
    }
  }

  const saved = await db.updateSiteSettings(incoming);
  await audit(req, session, isAdmin ? "UPDATED_SITE_SETTINGS" : "UPDATED_COUNTDOWN", "site", c.enabled ? `countdown on until ${c.targetDate}` : "");
  revalidatePath("/", "layout");
  return ok(saved);
});
