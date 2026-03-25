import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createVersionSnapshot } from "@/lib/version";
import { checkLockVersion, ConflictError, conflictResponse } from "@/lib/conflict";

import { VALID_STAGES_SET } from "@/lib/constants";

const funnelNumbersSchema = z.record(z.string(), z.string()).refine(
  (obj) => Object.keys(obj).every((k) => VALID_STAGES_SET.has(k)),
  { message: "Keys must be valid stage names" },
);

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Params) {
  try {
    const { id } = await context.params;

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        company: { include: { aliases: true } },
        progressItems: { orderBy: [{ stage: "asc" }, { sortOrder: "asc" }] },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Business not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: business });
  } catch (error) {
    console.error("GET /api/businesses/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { lockVersion, ...updateData } = body;

    const current = await prisma.business.findUnique({ where: { id } });

    if (!current) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Business not found" },
        { status: 404 },
      );
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

    // Validate funnelNumbers if present
    if (updateData.funnelNumbers !== undefined && updateData.funnelNumbers !== null) {
      const parsed = funnelNumbersSchema.safeParse(updateData.funnelNumbers);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "VALIDATION", message: "Invalid funnelNumbers: keys must be valid stages, values must be strings" },
          { status: 400 },
        );
      }
    }

    const isFunnelOnly = Object.keys(updateData).length === 1 && updateData.funnelNumbers !== undefined;
    const data: Record<string, unknown> = isFunnelOnly ? {} : { lockVersion: { increment: 1 } };
    if (updateData.funnelNumbers !== undefined) data.funnelNumbers = updateData.funnelNumbers;
    if (updateData.name !== undefined) data.name = updateData.name.trim();
    if (updateData.embargoName !== undefined) data.embargoName = updateData.embargoName;
    if (updateData.visibility !== undefined) data.visibility = updateData.visibility;
    if (updateData.scale !== undefined) data.scale = updateData.scale;
    if (updateData.timingText !== undefined) data.timingText = updateData.timingText;
    if (updateData.timingStart !== undefined)
      data.timingStart = updateData.timingStart ? new Date(updateData.timingStart) : null;
    if (updateData.timingEnd !== undefined)
      data.timingEnd = updateData.timingEnd ? new Date(updateData.timingEnd) : null;
    if (updateData.currentStage !== undefined) data.currentStage = updateData.currentStage;
    if (updateData.assignedTo !== undefined) data.assignedToId = updateData.assignedTo;
    if (updateData.sortOrder !== undefined) data.sortOrder = updateData.sortOrder;

    const updated = await prisma.business.update({
      where: { id },
      data,
      include: { company: true },
    });

    await createVersionSnapshot({
      entityType: "business",
      entityId: id,
      snapshot: JSON.parse(JSON.stringify(updated)),
    });

    await createAuditLog({
      entityType: "business",
      entityId: id,
      action: "update",
      changes: {
        before: JSON.parse(JSON.stringify(current)),
        after: JSON.parse(JSON.stringify(updated)),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/businesses/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (action === "archive") {
      const business = await prisma.business.update({
        where: { id },
        data: { isArchived: true, archivedAt: new Date(), lockVersion: { increment: 1 } },
      });
      await createAuditLog({ entityType: "business", entityId: id, action: "delete", summary: "Archived" });
      return NextResponse.json({ data: business });
    }

    if (action === "restore") {
      const business = await prisma.business.update({
        where: { id },
        data: { isArchived: false, archivedAt: null, lockVersion: { increment: 1 } },
      });
      await createAuditLog({ entityType: "business", entityId: id, action: "create", summary: "Restored" });
      return NextResponse.json({ data: business });
    }

    return NextResponse.json(
      { error: "VALIDATION", message: "Unknown action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("POST /api/businesses/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
