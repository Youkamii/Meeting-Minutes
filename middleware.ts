import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Not logged in → redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Pending user → only allow /pending page
  const status = (session.user as Record<string, unknown>)?.status;
  if (status === "pending" && pathname !== "/pending") {
    return NextResponse.redirect(new URL("/pending", req.url));
  }

  // Approved user on /pending → redirect to home
  if (status === "approved" && pathname === "/pending") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    const role = (session.user as Record<string, unknown>)?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|pending).*)",
  ],
};
