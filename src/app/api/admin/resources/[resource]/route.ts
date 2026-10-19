import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ADMIN_RESOURCES, isAdminResource } from "@/lib/admin-resources";
import { ok, fail, handle, audit } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ resource: string }> };

export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  const { resource } = await params;
  if (!isAdminResource(resource)) return fail("Unknown resource", 404);
  await requireRole(ADMIN_RESOURCES[resource].roles);
  return ok(await db.adminList(resource));
});

export const POST = handle(async (req: NextRequest, { params }: Ctx) => {
  const { resource } = await params;
  if (!isAdminResource(resource)) return fail("Unknown resource", 404);
  const cfg = ADMIN_RESOURCES[resource];
  const session = await requireRole(cfg.roles);
  const data = cfg.schema.parse(await req.json());
  const created: any = await db.adminCreate(resource, data);
  await audit(req, session, `CREATED_${resource.toUpperCase()}`, created?.name || created?.title || created?.id || "");
  return ok(created, 201);
});
