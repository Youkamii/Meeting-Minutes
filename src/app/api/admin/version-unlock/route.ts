import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { auth } from "@/lib/auth";
import {
  VERSION_UNLOCK_COOKIE,
  versionUnlockToken,
} from "@/lib/version-unlock";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // empty body
  }

  const pw = process.env.VERSION_UNLOCK_PASSWORD;
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

  const token = await versionUnlockToken();
  const res = NextResponse.json({ data: { unlocked: true } });
  res.cookies.set(VERSION_UNLOCK_COOKIE, token, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 hours
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ data: { unlocked: false } });
  res.cookies.delete(VERSION_UNLOCK_COOKIE);
  return res;
}
