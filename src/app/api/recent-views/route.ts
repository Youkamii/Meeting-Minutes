import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const sessionId = searchParams.get("session_id");

  const where = sessionId ? { sessionId } : {};

  const data = await prisma.recentView.findMany({
    where,
    orderBy: { viewedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { entityType, entityId, sessionId } = body;

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: "VALIDATION", message: "entityType and entityId are required" },
      { status: 400 },
    );
  }

  const view = await prisma.recentView.create({
    data: { entityType, entityId, sessionId: sessionId ?? null },
  });

  return NextResponse.json({ data: view }, { status: 201 });
}
