import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => ok(await db.getSiteSettings()));
