// TODO: Add authentication/authorization middleware.
// Currently unauthenticated — acceptable for internal tooling, but must be
// secured before any external or multi-tenant exposure.

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

    // Audit log only for IDs that were actually updated
    const updatedRecords = await prisma.business.findMany({
      where: { id: { in: entityIds }, assignedToId: assignedTo ?? null },
      select: { id: true },
    });
    for (const record of updatedRecords) {
      await createAuditLog({
        entityType,
        entityId: record.id,
        action: "update",
        changes: { assignedTo },
        summary: `Bulk assignee change`,
      });
    }
  } else if (entityType === "weekly_action") {
    const result = await prisma.weeklyAction.updateMany({
      where: { id: { in: entityIds } },
      data: { assignedToId: assignedTo ?? null },
    });
    updatedCount = result.count;

    // Audit log only for IDs that were actually updated
    const updatedRecords = await prisma.weeklyAction.findMany({
      where: { id: { in: entityIds }, assignedToId: assignedTo ?? null },
      select: { id: true },
    });
    for (const record of updatedRecords) {
      await createAuditLog({
        entityType,
        entityId: record.id,
        action: "update",
        changes: { assignedTo },
        summary: `Bulk assignee change`,
      });
    }
  } else {
    return NextResponse.json(
      { error: "VALIDATION", message: "entityType must be business or weekly_action" },
      { status: 400 },
    );
  }

  return NextResponse.json({ updatedCount });
}
