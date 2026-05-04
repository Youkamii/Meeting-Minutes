import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { cleanupExpiredCheckpoints } from "@/lib/checkpoint";

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Admin role required" },
      { status: 403 },
    );
  }

  const result = await cleanupExpiredCheckpoints();
  return NextResponse.json({ data: result });
}
