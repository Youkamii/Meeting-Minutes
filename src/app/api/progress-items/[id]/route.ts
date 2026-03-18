import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createVersionSnapshot } from "@/lib/version";
import { checkLockVersion, ConflictError, conflictResponse } from "@/lib/conflict";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Params) {
  const { id } = await context.params;
  const item = await prisma.progressItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ data: item });
}

export async function PUT(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const body = await request.json();
  const { title, content, date, sortOrder, lockVersion } = body;

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
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(content !== undefined ? { content: content.trim() } : {}),
      ...(date !== undefined ? { date: date ? new Date(date) : null } : {}),
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

  if (body.action === "move") {
    const { targetStage, sortOrder, lockVersion } = body;

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

export async function DELETE(_request: NextRequest, context: Params) {
  const { id } = await context.params;

  const item = await prisma.progressItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
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
