// JWT helpers that are safe to import from proxy.ts (no database access).
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "efcob_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface TokenPayload {
  sub: string;
  role: string;
  v: number;
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role, v: payload.v })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { sub: payload.sub, role: String(payload.role || ""), v: Number(payload.v || 0) };
  } catch {
    return null;
  }
}

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "TOURNAMENT_OFFICIAL", "SENIOR_REFEREE", "REFEREE"];
