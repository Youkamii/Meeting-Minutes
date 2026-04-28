import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { createVersionSnapshot } from "@/lib/version";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cycleId = searchParams.get("cycle_id");
  const cycleIds = searchParams.get("cycle_ids"); // batch: comma-separated cycle IDs
  const companyId = searchParams.get("company_id");
  const businessId = searchParams.get("business_id");
  const assignedTo = searchParams.get("assigned_to");
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";
  const includeArchived = searchParams.get("include_archived") === "true";

  // Support batch cycle_ids (comma-separated) for single-request monthly view
  const cycleIdFilter = cycleIds
    ? { cycleId: { in: cycleIds.split(",").filter(Boolean) } }
    : cycleId
      ? { cycleId }
      : {};

  const where = {
    ...(includeArchived ? {} : { isArchived: false }),
    ...cycleIdFilter,
    ...(companyId ? { companyId } : {}),
    ...(businessId ? { businessId } : {}),
    ...(assignedTo ? { assignedToId: assignedTo } : {}),
    ...(status ? { status: status as never } : {}),
    ...(search
      ? { content: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.weeklyAction.findMany({
      where,
      include: {
        company: true,
        business: true,
        cycle: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.weeklyAction.count({ where }),
  ]);

  return NextResponse.json({ data, total });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    cycleId,
    companyId,
    businessId,
    content,
    assignedTo,
    status = "scheduled",
    priority = "medium",
  } = body;

  if (!cycleId || !companyId || !content?.trim()) {
    return NextResponse.json(
      { error: "VALIDATION", message: "cycleId, companyId, and content are required" },
      { status: 400 },
    );
  }

  const maxSort = await prisma.weeklyAction.aggregate({
    where: { cycleId, companyId },
    _max: { sortOrder: true },
  });

  const action = await prisma.weeklyAction.create({
    data: {
      cycleId,
      companyId,
      businessId: businessId ?? null,
      content: content.trim(),
      assignedToId: assignedTo ?? null,
      status,
      priority,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
    include: { company: true, business: true, cycle: true },
  });

  await createVersionSnapshot({
    entityType: "weeklyAction",
    entityId: action.id,
    snapshot: JSON.parse(JSON.stringify(action)),
  });

  await createAuditLog({
    entityType: "weekly_action",
    entityId: action.id,
    action: "create",
    ip: getClientIp(request),
    changes: { content: content.trim(), companyId, status, priority },
  });

  return NextResponse.json({ data: action }, { status: 201 });
}
