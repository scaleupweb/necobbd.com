import { NextRequest } from "next/server";
import { ClubRegisterSchema } from "@/lib/validation";
import { db, slugify } from "@/lib/db";
import { connectDB } from "@/lib/db/mongo";
import { Club, User, Player } from "@/lib/db/models";
import { getSession, hashPassword, setSessionCookie } from "@/lib/auth";
import { ok, fail, handle, limit } from "@/lib/api";

// Signed-in players only send club details; their own account becomes the manager.
const ClubOnlySchema = ClubRegisterSchema.pick({
  clubName: true,
  shortName: true,
  location: true,
  facebookPage: true,
  slogan: true,
  description: true,
  website: true,
});

async function clubTaken(name: string, shortName: string) {
  const nameTaken = await Club.exists({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
  if (nameTaken) return "A club with this name is already registered";
  if (await Club.exists({ shortName })) return "This short tag is already used by another club";
  return null;
}

/**
 * Registers a club. Signed-in users manage it from their existing account;
 * visitors get a new club-manager login. New clubs stay PENDING until an admin approves.
 */
export const POST = handle(async (req: NextRequest) => {
  limit(req, "register-club", 5, 60 * 60 * 1000);
  const body = await req.json();
  await connectDB();
  const session = await getSession();

  if (session) {
    const data = ClubOnlySchema.parse(body);
    if (data.website) return ok({ id: "" }, 201);
    if (await db.getManagedClub(session.id)) return fail("You already manage a club. Open My Club to manage it.", 409, "CONFLICT");
    const taken = await clubTaken(data.clubName, data.shortName);
    if (taken) return fail(taken, 409, "CONFLICT");

    const club = await db.createClub({
      name: data.clubName,
      shortName: data.shortName,
      location: data.location,
      facebookPage: data.facebookPage,
      slogan: data.slogan,
      description: data.description,
      email: session.email,
      status: "PENDING",
    });
    await Club.updateOne({ _id: club.id }, { $set: { managerId: session.id } });
    // A free agent who founds a club also plays for it.
    if (!session.clubId) {
      await User.updateOne({ _id: session.id }, { $set: { clubId: club.id } });
      await Player.updateOne({ userId: session.id, clubId: { $exists: false } }, { $set: { clubId: club.id, seat: 1, "contract.status": "UNDER_CONTRACT" } });
    }
    await db.notify(session.id, "Club registration received", `${data.clubName} is waiting for admin approval.`, "/dashboard/my-club");
    return ok({ clubId: club.id, slug: club.slug }, 201);
  }

  const data = ClubRegisterSchema.parse(body);
  if (data.website) return ok({ id: "" }, 201);
  if (await db.getUserByEmailOrUsername(data.email)) {
    return fail("An account with this email already exists. Sign in first, then register your club from your account.", 409, "CONFLICT");
  }
  const taken = await clubTaken(data.clubName, data.shortName);
  if (taken) return fail(taken, 409, "CONFLICT");

  const base = `${slugify(data.shortName)}-club`;
  let username = base;
  for (let n = 2; await User.exists({ username }); n++) username = `${base}-${n}`;

  const user = await db.createUser({
    email: data.email,
    username,
    fullName: data.managerName,
    passwordHash: await hashPassword(data.password),
    role: "CLUB_MANAGER",
  });

  const club = await db.createClub({
    name: data.clubName,
    shortName: data.shortName,
    email: data.email,
    location: data.location,
    facebookPage: data.facebookPage,
    slogan: data.slogan,
    description: data.description,
    managerId: String(user._id),
    status: "PENDING",
  });

  await db.notify(String(user._id), "Club registration received", `${data.clubName} is waiting for admin approval. You'll be notified once it's active.`, "/dashboard/my-club");
  await setSessionCookie(user);
  return ok({ clubId: club.id, slug: club.slug, username }, 201);
});
