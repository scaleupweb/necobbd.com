import { NextRequest } from "next/server";
import { RegisterSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { ok, fail, handle, parseBody, limit } from "@/lib/api";

const RESERVED = new Set(["admin", "administrator", "root", "support", "system", "moderator", "api", "login", "register", "dashboard"]);

export const POST = handle(async (req: NextRequest) => {
  limit(req, "register", 5, 60 * 60 * 1000);
  const data = await parseBody(req, RegisterSchema);

  // Bots fill the hidden "website" field; pretend success without creating anything.
  if (data.website) return ok({ id: "" }, 201);

  if (RESERVED.has(data.username)) return fail("That username is reserved", 409, "CONFLICT");

  const [byEmail, byUsername] = await Promise.all([db.getUserByEmailOrUsername(data.email), db.getUserByEmailOrUsername(data.username)]);
  if (byEmail || byUsername) {
    return fail(byEmail ? "An account with this email already exists" : "This username is taken", 409, "CONFLICT");
  }

  const passwordHash = await hashPassword(data.password);
  const user = await db.createUser({
    email: data.email,
    username: data.username,
    fullName: data.fullName,
    passwordHash,
    role: "PLAYER",
  });

  const player = await db.createPlayer({
    userId: user._id,
    username: data.username,
    fullName: data.fullName,
    konamiId: data.konamiId,
    deviceModel: data.deviceModel,
    dob: data.dob,
    facebookProfile: data.facebookProfile,
    preferredPosition: data.preferredPosition,
    playStyle: data.playStyle,
    bio: data.bio,
    phone: data.phone,
  });

  await db.notify(String(user._id), "Welcome aboard!", "Complete your profile and join an open tournament to get started.", "/dashboard");
  await setSessionCookie(user);

  return ok(
    {
      id: String(user._id),
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      avatar: player.avatar,
      playerProfileId: player.id,
    },
    201
  );
});
