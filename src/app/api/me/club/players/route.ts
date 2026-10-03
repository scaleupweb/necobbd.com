import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, hashPassword } from "@/lib/auth";
import { ClubRegisterPlayerSchema } from "@/lib/validation";
import { ok, fail, handle, parseBody, audit, limit } from "@/lib/api";
import { SQUAD_LIMIT, CONTRACT_DAYS, openSeats } from "@/lib/squad";

const RESERVED = new Set(["admin", "administrator", "root", "support", "system", "moderator", "api", "login", "register", "dashboard"]);

/** Build a free username from the player's name, e.g. "Md Rahim Uddin" -> "md_rahim_uddin" (or "_2", "_3"…). */
async function freeUsername(fullName: string) {
  let base = fullName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  if (base.length < 3) base = `player_${base}`.replace(/_+$/, "");
  for (let i = 0; i < 50; i++) {
    const name = i === 0 ? base : `${base}_${i + 1}`;
    if (RESERVED.has(name)) continue;
    if (!(await db.getUserByEmailOrUsername(name))) return name;
  }
  return `${base}_${Date.now().toString(36)}`;
}

/** Club manager registers a brand-new player account directly into their club. */
export const POST = handle(async (req: NextRequest) => {
  const session = await requireAuth();
  limit(req, `club-register-player:${session.id}`, 30, 60 * 60 * 1000);
  const data = await parseBody(req, ClubRegisterPlayerSchema);

  const clubId = await db.getEditableClubId(session.id);
  if (!clubId || !(await db.canUseClubTool(session.id, clubId, "register-player"))) return fail("You don't have access to register players", 403, "FORBIDDEN");
  const club = await db.getClubById(clubId);
  if (!club) return fail("Club not found", 404, "NOT_FOUND");
  if (club.status !== "ACTIVE") return fail("Your club must be approved before registering players", 409, "CONFLICT");

  if (club.squad.length >= SQUAD_LIMIT) return fail(`Main Team Squad is full (${club.squad.length}/${SQUAD_LIMIT}). Release a player first.`, 409, "CONFLICT");
  if (await db.getUserByEmailOrUsername(data.email)) return fail("An account with this email already exists", 409, "CONFLICT");
  const worn = club.squad.find((p: any) => p.shirtNo === data.shirtNo);
  if (worn) return fail(`#${data.shirtNo} is already worn by ${worn.fullName}`, 409, "CONFLICT");

  const username = await freeUsername(data.fullName);
  const user = await db.createUser({
    email: data.email,
    username,
    fullName: data.fullName,
    passwordHash: await hashPassword(data.password),
    role: "PLAYER",
  });
  const player = await db.createPlayer({
    userId: user._id,
    username,
    fullName: data.fullName,
    avatar: data.avatar,
    konamiId: data.konamiId,
    deviceModel: data.deviceModel,
    facebookProfile: data.facebookProfile,
    dob: data.dob || undefined,
    clubId,
  });
  const now = Date.now();
  await db.updatePlayer(player.id, {
    shirtNo: data.shirtNo,
    seat: openSeats(club.squad)[0],
    squad: "main",
    "contract.status": "UNDER_CONTRACT",
    "contract.startDate": new Date(now),
    "contract.endDate": new Date(now + CONTRACT_DAYS * 86400000),
  });
  await db.notify(String(user._id), `Welcome to ${club.name}!`, `${club.name} registered you on the platform. Complete your profile from your dashboard.`, "/dashboard");
  await audit(req, session, "CLUB_REGISTERED_PLAYER", `Club ${club.name}`, `${data.fullName} (@${username})`);

  return ok({ id: player.id, username, email: user.email, fullName: data.fullName }, 201);
});
