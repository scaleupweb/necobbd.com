import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, hashPassword, ADMIN_ONLY } from "@/lib/auth";
import { UserAdminCreateSchema } from "@/lib/validation";
import { ok, fail, handle, parseBody, audit } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  await requireRole(ADMIN_ONLY);
  const sp = req.nextUrl.searchParams;
  const users = await db.listUsers({ search: sp.get("search") || undefined, role: sp.get("role") || undefined, status: sp.get("status") || undefined });
  return ok(users);
});

export const POST = handle(async (req: NextRequest) => {
  const session = await requireRole(ADMIN_ONLY);
  const data = await parseBody(req, UserAdminCreateSchema);
  if ((data.role === "SUPER_ADMIN" || data.role === "ADMIN") && session.role !== "SUPER_ADMIN") {
    return fail("Only a super admin can create admin accounts", 403, "FORBIDDEN");
  }
  const exists = (await db.getUserByEmailOrUsername(data.email)) || (await db.getUserByEmailOrUsername(data.username));
  if (exists) return fail("Email or username already in use", 409, "CONFLICT");

  const user = await db.createUser({
    email: data.email,
    username: data.username,
    fullName: data.fullName,
    passwordHash: await hashPassword(data.password),
    role: data.role,
  });
  if (data.createPlayerProfile) {
    await db.createPlayer({ userId: user._id, username: data.username, fullName: data.fullName, konamiId: data.konamiId });
  }
  await audit(req, session, "CREATED_USER", `${data.username} (${data.role})`);
  return ok({ id: String(user._id) }, 201);
});
