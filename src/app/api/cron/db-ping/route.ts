import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = secret ? `Bearer ${secret}` : null;
  if (!expected || !safeEqual(auth, expected)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
