import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createVersionSnapshot } from "@/lib/version";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const companyId = searchParams.get("company_id");
    const stage = searchParams.get("stage");
    const assignedTo = searchParams.get("assigned_to");
    const search = searchParams.get("search") ?? "";
    const includeArchived = searchParams.get("include_archived") === "true";

    const where = {
      ...(includeArchived ? {} : { isArchived: false }),
      ...(companyId ? { companyId } : {}),
      ...(stage ? { currentStage: stage as never } : {}),
      ...(assignedTo ? { assignedToId: assignedTo } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: {
          company: { include: { aliases: true } },
          progressItems: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.business.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error("GET /api/businesses error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      name,
      visibility = "public",
      scale,
      timingText,
      timingStart,
      timingEnd,
      assignedTo,
    } = body;

    if (!companyId || !name?.trim()) {
      return NextResponse.json(
        { error: "VALIDATION", message: "companyId and name are required" },
        { status: 400 },
      );
    }

    const business = await prisma.business.create({
      data: {
        companyId,
        name: name.trim(),
        visibility,
        scale: scale ?? null,
        timingText: timingText ?? null,
        timingStart: timingStart ? new Date(timingStart) : null,
        timingEnd: timingEnd ? new Date(timingEnd) : null,
        assignedToId: assignedTo ?? null,
      },
      include: { company: true },
    });

    await createVersionSnapshot({
      entityType: "business",
      entityId: business.id,
      snapshot: JSON.parse(JSON.stringify(business)),
    });

    await createAuditLog({
      entityType: "business",
      entityId: business.id,
      action: "create",
      changes: { name, companyId, visibility },
    });

    return NextResponse.json({ data: business }, { status: 201 });
  } catch (error) {
    console.error("POST /api/businesses error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
