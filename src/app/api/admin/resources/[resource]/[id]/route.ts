import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ADMIN_RESOURCES, isAdminResource, onlySent } from "@/lib/admin-resources";
import { ok, fail, handle, audit } from "@/lib/api";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  const { resource, id } = await params;
  if (!isAdminResource(resource)) return fail("Unknown resource", 404);
  const cfg = ADMIN_RESOURCES[resource];
  const session = await requireRole(cfg.roles);
  const raw = await req.json();
  const data = onlySent(cfg.partial.parse(raw), raw);
  const updated: any = await db.adminUpdate(resource, id, data);
  await audit(req, session, `UPDATED_${resource.toUpperCase()}`, updated?.name || updated?.title || id, Object.keys(data).join(", "));
  return ok(updated);
});

export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  const { resource, id } = await params;
  if (!isAdminResource(resource)) return fail("Unknown resource", 404);
  const session = await requireRole(ADMIN_RESOURCES[resource].roles);
  await db.adminDelete(resource, id);
  await audit(req, session, `DELETED_${resource.toUpperCase()}`, id);
  return ok({ deleted: true });
});
