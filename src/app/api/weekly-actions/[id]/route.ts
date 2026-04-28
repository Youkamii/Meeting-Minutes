import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { createVersionSnapshot } from "@/lib/version";
import { checkLockVersion, ConflictError, conflictResponse } from "@/lib/conflict";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Params) {
  const { id } = await context.params;
  const action = await prisma.weeklyAction.findUnique({
    where: { id },
    include: { company: true, business: true, cycle: true },
  });

  if (!action) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: action });
}

export async function PUT(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const body = await request.json();
  const { lockVersion, ...updateData } = body;

  const current = await prisma.weeklyAction.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    checkLockVersion(
      current.lockVersion,
      lockVersion,
      JSON.parse(JSON.stringify(current)),
      body,
    );
  } catch (e) {
    if (e instanceof ConflictError) return conflictResponse(e);
    throw e;
  }

  const oldStatus = current.status;

  const data: Record<string, unknown> = { lockVersion: { increment: 1 } };
  if (updateData.content !== undefined) data.content = updateData.content.trim();
  if (updateData.assignedTo !== undefined) data.assignedToId = updateData.assignedTo;
  if (updateData.status !== undefined) data.status = updateData.status;
  if (updateData.priority !== undefined) data.priority = updateData.priority;
  if (updateData.businessId !== undefined) data.businessId = updateData.businessId;
  if (updateData.sortOrder !== undefined) data.sortOrder = updateData.sortOrder;

  const updated = await prisma.weeklyAction.update({
    where: { id },
    data,
    include: { company: true, business: true, cycle: true },
  });

  await createVersionSnapshot({
    entityType: "weeklyAction",
    entityId: id,
    snapshot: JSON.parse(JSON.stringify(updated)),
  });

  const action = updateData.status && updateData.status !== oldStatus
    ? "status_change"
    : updateData.assignedTo !== undefined
      ? "update"
      : "update";

  await createAuditLog({
    entityType: "weekly_action",
    entityId: id,
    action,
    ip: getClientIp(request),
    changes: {
      before: JSON.parse(JSON.stringify(current)),
      after: JSON.parse(JSON.stringify(updated)),
    },
    summary:
      updateData.status && updateData.status !== oldStatus
        ? `Status: ${oldStatus} → ${updateData.status}`
        : undefined,
  });

  return NextResponse.json({ data: updated });
}

export async function POST(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const body = await request.json();
  const { action: actionType } = body;

  if (actionType === "archive") {
    const a = await prisma.weeklyAction.update({
      where: { id },
      data: { isArchived: true, archivedAt: new Date(), lockVersion: { increment: 1 } },
    });
    await createAuditLog({ entityType: "weekly_action", entityId: id, action: "delete", ip: getClientIp(request), summary: "Archived" });
    return NextResponse.json({ data: a });
  }

  if (actionType === "restore") {
    const a = await prisma.weeklyAction.update({
      where: { id },
      data: { isArchived: false, archivedAt: null, lockVersion: { increment: 1 } },
    });
    await createAuditLog({ entityType: "weekly_action", entityId: id, action: "create", ip: getClientIp(request), summary: "Restored" });
    return NextResponse.json({ data: a });
  }

  return NextResponse.json({ error: "VALIDATION", message: "Unknown action" }, { status: 400 });
}
