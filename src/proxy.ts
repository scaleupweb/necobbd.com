import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken, ADMIN_ROLES } from "@/lib/auth/token";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF: state-changing API calls must come from this site.
  if (pathname.startsWith("/api/") && MUTATING.has(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (origin) {
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {
        /* invalid origin */
      }
      if (!host || originHost !== host) {
        return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Cross-site request blocked" } }, { status: 403 });
      }
    } else if (req.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Cross-site request blocked" } }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Optimistic page guards; every API route re-checks the session against the database.
  const needsAuth = pathname.startsWith("/dashboard") || pathname.startsWith("/notifications") || pathname.startsWith("/admin");
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token).catch(() => null) : null;
  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && !ADMIN_ROLES.includes(payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/dashboard/:path*", "/notifications/:path*"],
};
