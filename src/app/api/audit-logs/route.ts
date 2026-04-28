import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");
  const action = searchParams.get("action");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50") || 50, 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0") || 0, 0);

  // Validate date parameters
  if (fromDate && isNaN(new Date(fromDate).getTime())) {
    return NextResponse.json(
      { error: "VALIDATION", message: "from_date is not a valid date" },
      { status: 400 },
    );
  }
  if (toDate && isNaN(new Date(toDate).getTime())) {
    return NextResponse.json(
      { error: "VALIDATION", message: "to_date is not a valid date" },
      { status: 400 },
    );
  }

  const where = {
    ...(entityType ? { entityType } : {}),
    ...(entityId ? { entityId } : {}),
    ...(action ? { action } : {}),
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: new Date(toDate) } : {}),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      omit: { ip: true },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ data, total });
}
