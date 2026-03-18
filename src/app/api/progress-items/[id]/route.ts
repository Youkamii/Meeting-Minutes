import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createVersionSnapshot } from "@/lib/version";
import { checkLockVersion, ConflictError, conflictResponse } from "@/lib/conflict";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const body = await request.json();
  const { content, sortOrder, lockVersion } = body;

  const current = await prisma.progressItem.findUnique({ where: { id } });
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

  const updated = await prisma.progressItem.update({
    where: { id },
    data: {
      ...(content !== undefined ? { content: content.trim() } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
      lockVersion: { increment: 1 },
    },
  });

  await createVersionSnapshot({
    entityType: "progressItem",
    entityId: id,
    snapshot: JSON.parse(JSON.stringify(updated)),
  });

  await createAuditLog({
    entityType: "progress_item",
    entityId: id,
    action: "update",
    changes: {
      before: JSON.parse(JSON.stringify(current)),
      after: JSON.parse(JSON.stringify(updated)),
    },
  });

  return NextResponse.json({ data: updated });
}

export async function POST(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const body = await request.json();

  const VALID_STAGES = ["inbound", "funnel", "pipeline", "proposal", "contract", "build", "maintenance"];

  if (body.action === "move") {
    const { targetStage, sortOrder, lockVersion } = body;

    if (!targetStage || !VALID_STAGES.includes(targetStage)) {
      return NextResponse.json(
        { error: "VALIDATION", message: `Invalid stage "${targetStage}". Must be one of: ${VALID_STAGES.join(", ")}` },
        { status: 400 },
      );
    }

    const current = await prisma.progressItem.findUnique({ where: { id } });
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

    const fromStage = current.stage;

    const updated = await prisma.progressItem.update({
      where: { id },
      data: {
        stage: targetStage,
        sortOrder: sortOrder ?? 0,
        lockVersion: { increment: 1 },
      },
    });

    await createVersionSnapshot({
      entityType: "progressItem",
      entityId: id,
      snapshot: JSON.parse(JSON.stringify(updated)),
    });

    await createAuditLog({
      entityType: "progress_item",
      entityId: id,
      action: "move",
      changes: { fromStage, toStage: targetStage },
      summary: `Moved from ${fromStage} to ${targetStage}`,
    });

    return NextResponse.json({ data: updated });
  }

  return NextResponse.json(
    { error: "VALIDATION", message: "Unknown action" },
    { status: 400 },
  );
}

export async function DELETE(request: NextRequest, context: Params) {
  const { id } = await context.params;

  const item = await prisma.progressItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // H2: Verify lockVersion before deleting
  let lockVersion: number | undefined;
  try {
    const body = await request.json();
    lockVersion = body.lockVersion;
  } catch {
    // no body — treat as missing lockVersion
  }

  try {
    checkLockVersion(
      item.lockVersion,
      lockVersion,
      JSON.parse(JSON.stringify(item)),
      { lockVersion },
    );
  } catch (e) {
    if (e instanceof ConflictError) return conflictResponse(e);
    throw e;
  }

  await prisma.progressItem.delete({ where: { id } });

  await createAuditLog({
    entityType: "progress_item",
    entityId: id,
    action: "delete",
    changes: JSON.parse(JSON.stringify(item)),
  });

  return new NextResponse(null, { status: 204 });
}
