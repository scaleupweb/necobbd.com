import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError, ZodTypeAny } from "zod";
import { AuthError } from "@/lib/auth";
import { ServiceError, db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { UserSession } from "@/types";

export function ok(data: any, status = 200, extra: Record<string, any> = {}) {
  return NextResponse.json({ success: true, data, ...extra }, { status });
}

export function fail(message: string, status = 400, code = "BAD_REQUEST", details?: any) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/** Wraps a route handler so thrown auth/validation/service errors become clean JSON responses. */
export function handle<C = any>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err: any) {
      if (err instanceof AuthError) {
        return err.status === 401 ? fail("Please sign in to continue", 401, "UNAUTHORIZED") : fail("You don't have permission to do that", 403, "FORBIDDEN");
      }
      if (err instanceof ZodError) {
        return fail(err.errors[0]?.message || "Invalid input", 400, "VALIDATION_ERROR", err.flatten());
      }
      if (err instanceof ServiceError) return fail(err.message, err.status, err.code);
      if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "value";
        return fail(`That ${field} is already taken`, 409, "CONFLICT");
      }
      if (err?.name === "ValidationError" || err?.name === "CastError") return fail(err.message, 400, "VALIDATION_ERROR");
      if (err instanceof SyntaxError) return fail("Invalid JSON body", 400);
      console.error("API error:", err);
      return fail("Something went wrong. Please try again.", 500, "SERVER_ERROR");
    }
  };
}

export async function parseBody<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.output<S>> {
  const body = await req.json();
  return schema.parse(body);
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip")) || "unknown";
}

export function limit(req: NextRequest, name: string, max: number, windowMs: number) {
  const r = rateLimit(`${name}:${clientIp(req)}`, max, windowMs);
  if (!r.ok) throw new ServiceError(`Too many attempts. Try again in ${Math.ceil(r.retryAfter / 60)} minute(s).`, 429, "RATE_LIMITED");
}

export async function audit(req: NextRequest, session: UserSession, action: string, target: string, details = "") {
  try {
    await db.addAuditLog({ adminId: session.id, adminName: session.fullName, action, target, details, ipAddress: clientIp(req) });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
