import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// API routes that mutate but are allowed for read-only users:
//   - recent-views: view tracking (not content editing)
//   - export: data download (a read operation exposed via POST)
const WRITE_WHITELIST = ["/api/recent-views", "/api/export"];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    cookieName:
      req.nextUrl.protocol === "https:"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  // Not logged in
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const status = token.status as string | undefined;
  const role = token.role as string | undefined;
  const canEdit = role === "admin" || token.canEdit === true;

  // Rejected or pending
  if (status === "rejected" || status === "pending") {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (pathname !== "/pending") {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
  }

  // Approved user on /pending → redirect to home
  if (status === "approved" && pathname === "/pending") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Admin routes protection — admin role only (no extra password gate)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (role !== "admin") {
      if (isApiRoute) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Admins implicitly can edit — allow through.
    return NextResponse.next();
  }

  // Read-only enforcement: block content-mutating API calls unless the user
  // has edit permission. Admin routes handled above; whitelist for non-content
  // writes (view tracking, exports).
  if (
    isApiRoute &&
    MUTATING_METHODS.has(req.method) &&
    !canEdit &&
    !WRITE_WHITELIST.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.json(
      { error: "ReadOnly", message: "Edit permission required" },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|login|pending|privacy).*)",
  ],
};
