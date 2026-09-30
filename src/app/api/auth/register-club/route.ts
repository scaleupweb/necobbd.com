import { NextRequest } from "next/server";
import { ClubRegisterSchema } from "@/lib/validation";
import { db, slugify } from "@/lib/db";
import { connectDB } from "@/lib/db/mongo";
import { Club, User } from "@/lib/db/models";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { ok, fail, handle, parseBody, limit } from "@/lib/api";

/**
 * Registers a club and its manager login in one step. The club stays PENDING
 * until an admin approves it from Admin → Clubs.
 */
export const POST = handle(async (req: NextRequest) => {
  limit(req, "register-club", 3, 60 * 60 * 1000);
  const data = await parseBody(req, ClubRegisterSchema);
  if (data.website) return ok({ id: "" }, 201);

  await connectDB();
  if (await db.getUserByEmailOrUsername(data.email)) return fail("An account with this email already exists. Sign in and ask an admin to link your club.", 409, "CONFLICT");
  const nameTaken = await Club.exists({ name: new RegExp(`^${data.clubName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
  if (nameTaken) return fail("A club with this name is already registered", 409, "CONFLICT");
  if (await Club.exists({ shortName: data.shortName })) return fail("This short tag is already used by another club", 409, "CONFLICT");

  // Manager login username: <tag>-club, made unique if needed.
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
