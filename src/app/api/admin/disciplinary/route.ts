import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, DISCIPLINE_STAFF } from "@/lib/auth";
import { DisciplinaryActionSchema } from "@/lib/validation";
import { ok, handle, parseBody, audit } from "@/lib/api";

export const dynamic = "force-dynamic";

// Public register of sanctions (also shown on /disciplinary).
export const GET = handle(async () => ok(await db.getDisciplinaryRecords()));

export const POST = handle(async (req: NextRequest) => {
  const session = await requireRole(DISCIPLINE_STAFF);
  const data = await parseBody(req, DisciplinaryActionSchema);
  const record = await db.issueDisciplinaryAction({ ...data, issuedBy: session.fullName });
  await audit(req, session, `ISSUED_${data.penalty}`, record.targetName, data.reason);
  return ok(record, 201);
});
