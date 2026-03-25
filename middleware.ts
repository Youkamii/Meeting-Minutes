import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Not logged in → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const status = token.status as string | undefined;
  const role = token.role as string | undefined;

  // Rejected user → force logout
  if (status === "rejected") {
    return NextResponse.redirect(new URL("/api/auth/signout", req.url));
  }

  // Pending user → only allow /pending page
  if (status === "pending" && pathname !== "/pending") {
    return NextResponse.redirect(new URL("/pending", req.url));
  }

  // Approved user on /pending → redirect to home
  if (status === "approved" && pathname === "/pending") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Admin routes protection
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|pending).*)",
  ],
};
