import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import {
  ADMIN_UNLOCK_COOKIE,
  adminUnlockToken,
} from "@/lib/admin-unlock";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Admin role required" },
      { status: 403 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // empty body
  }

  const pw = process.env.ADMIN_UNLOCK_PASSWORD;
  if (
    !pw ||
    typeof body.password !== "string" ||
    !safeEqual(body.password, pw)
  ) {
    return NextResponse.json(
      { error: "VALIDATION", message: "Invalid password" },
      { status: 400 },
    );
  }

  const token = await adminUnlockToken();
  const res = NextResponse.json({ data: { unlocked: true } });
  res.cookies.set(ADMIN_UNLOCK_COOKIE, token, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ data: { unlocked: false } });
  res.cookies.delete(ADMIN_UNLOCK_COOKIE);
  return res;
}
