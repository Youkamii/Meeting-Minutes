import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { entityType, entityIds, assignedTo } = body;

  if (!entityType || !entityIds?.length) {
    return NextResponse.json(
      { error: "VALIDATION", message: "entityType and entityIds are required" },
      { status: 400 },
    );
  }

  let updatedCount = 0;

  if (entityType === "business") {
    const result = await prisma.business.updateMany({
      where: { id: { in: entityIds } },
      data: { assignedToId: assignedTo ?? null },
    });
    updatedCount = result.count;
  } else if (entityType === "weekly_action") {
    const result = await prisma.weeklyAction.updateMany({
      where: { id: { in: entityIds } },
      data: { assignedToId: assignedTo ?? null },
    });
    updatedCount = result.count;
  } else {
    return NextResponse.json(
      { error: "VALIDATION", message: "entityType must be business or weekly_action" },
      { status: 400 },
    );
  }

  for (const entityId of entityIds) {
    await createAuditLog({
      entityType,
      entityId,
      action: "update",
      changes: { assignedTo },
      summary: `Bulk assignee change`,
    });
  }

  return NextResponse.json({ updatedCount });
}
