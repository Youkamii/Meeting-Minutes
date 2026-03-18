import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createVersionSnapshot } from "@/lib/version";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sourceCycleId = searchParams.get("source_cycle_id");

  if (!sourceCycleId) {
    return NextResponse.json(
      { error: "VALIDATION", message: "source_cycle_id is required" },
      { status: 400 },
    );
  }

  const candidates = await prisma.weeklyAction.findMany({
    where: {
      cycleId: sourceCycleId,
      status: { in: ["scheduled", "in_progress"] },
      isArchived: false,
    },
    include: { company: true, business: true },
    orderBy: [{ companyId: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json({ data: candidates });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sourceCycleId, targetCycleId, actionIds } = body;

  if (!sourceCycleId || !targetCycleId || !actionIds?.length) {
    return NextResponse.json(
      {
        error: "VALIDATION",
        message: "sourceCycleId, targetCycleId, and actionIds are required",
      },
      { status: 400 },
    );
  }

  const sourceActions = await prisma.weeklyAction.findMany({
    where: { id: { in: actionIds }, cycleId: sourceCycleId },
  });

  const created = await prisma.$transaction(async (tx) => {
    const results = [];

    for (const source of sourceActions) {
      // Check for duplicate carryover
      const existing = await tx.weeklyAction.findUnique({
        where: {
          carriedFromId_cycleId: {
            carriedFromId: source.id,
            cycleId: targetCycleId,
          },
        },
      });

      if (existing) continue; // Skip already carried over

      const newAction = await tx.weeklyAction.create({
        data: {
          cycleId: targetCycleId,
          companyId: source.companyId,
          businessId: source.businessId,
          content: source.content,
          assignedToId: source.assignedToId,
          status: "scheduled",
          priority: source.priority,
          carriedFromId: source.id,
          carryoverCount: source.carryoverCount + 1,
          sortOrder: source.sortOrder,
        },
        include: { company: true, business: true, cycle: true },
      });

      await createVersionSnapshot({
        entityType: "weeklyAction",
        entityId: newAction.id,
        snapshot: JSON.parse(JSON.stringify(newAction)),
      });

      await createAuditLog({
        entityType: "weekly_action",
        entityId: newAction.id,
        action: "carryover",
        changes: {
          sourceCycleId,
          targetCycleId,
          originalActionId: source.id,
          carryoverCount: newAction.carryoverCount,
        },
        summary: `Carried over from previous week (count: ${newAction.carryoverCount})`,
      });

      results.push(newAction);
    }

    return results;
  });

  return NextResponse.json({
    data: created,
    carriedCount: created.length,
  });
}
