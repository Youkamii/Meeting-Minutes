import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Admin role required" },
      { status: 403 },
    );
  }

  // Placeholder: no persistence yet
  return NextResponse.json({ data: {} });
}

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Admin role required" },
      { status: 403 },
    );
  }

  const body = await request.json();

  // Placeholder: accept and return settings without persistence
  return NextResponse.json({ data: body });
}
