import "server-only";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { UserSession, Role } from "@/types";
import { connectDB } from "@/lib/db/mongo";
import { User, Player } from "@/lib/db/models";
import { COOKIE_NAME, SESSION_MAX_AGE, signToken, verifyToken } from "./token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Reads the session cookie and confirms it against the database, so banned
 * users, role changes and password resets take effect immediately.
 */
export const getSession = cache(async (): Promise<UserSession | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  try {
    await connectDB();
    const user = await User.findById(payload.sub).lean<any>();
    if (!user || user.status !== "ACTIVE" || (user.tokenVersion || 0) !== payload.v) return null;
    const player = await Player.findOne({ userId: user._id }, { _id: 1, avatar: 1, clubId: 1 }).lean<any>();
    return {
      id: String(user._id),
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      avatar: player?.avatar || user.avatar,
      playerProfileId: player ? String(player._id) : undefined,
      clubId: user.clubId ? String(user.clubId) : player?.clubId ? String(player.clubId) : undefined,
    };
  } catch (err) {
    console.error("Session lookup failed:", err);
    return null;
  }
});

export async function setSessionCookie(user: { _id: any; role: string; tokenVersion?: number }) {
  const token = await signToken({ sub: String(user._id), role: user.role, v: user.tokenVersion || 0 });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export class AuthError extends Error {
  status: number;
  constructor(message: "UNAUTHORIZED" | "FORBIDDEN") {
    super(message);
    this.status = message === "UNAUTHORIZED" ? 401 : 403;
  }
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) throw new AuthError("UNAUTHORIZED");
  return session;
}

export async function requireRole(allowedRoles: Role[]): Promise<UserSession> {
  const session = await requireAuth();
  if (session.role !== "SUPER_ADMIN" && !allowedRoles.includes(session.role)) {
    throw new AuthError("FORBIDDEN");
  }
  return session;
}

export const STAFF_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "TOURNAMENT_OFFICIAL", "SENIOR_REFEREE", "REFEREE"];
export const ADMIN_ONLY: Role[] = ["SUPER_ADMIN", "ADMIN"];
export const MATCH_OFFICIALS: Role[] = ["SUPER_ADMIN", "ADMIN", "TOURNAMENT_OFFICIAL", "SENIOR_REFEREE", "REFEREE"];
export const TOURNAMENT_STAFF: Role[] = ["SUPER_ADMIN", "ADMIN", "TOURNAMENT_OFFICIAL"];
export const DISCIPLINE_STAFF: Role[] = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SENIOR_REFEREE"];

export function isStaff(role?: string) {
  return !!role && (STAFF_ROLES as string[]).includes(role);
}
