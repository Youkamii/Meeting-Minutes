import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createVersionSnapshot } from "@/lib/version";

import { STAGES, isValidStage } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Params) {
  const { id } = await context.params;
  try {
    const item = await prisma.progressItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ data: item });
  } catch (e) {
    console.error("GET progress-item error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Params) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const { title, content, date, sortOrder } = body;

    const current = await prisma.progressItem.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const updated = await prisma.progressItem.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(content !== undefined ? { content: content.trim() } : {}),
        ...(date !== undefined ? { date: date ?? "" } : {}),
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
  } catch (e) {
    console.error("PUT progress-item error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Params) {
  const { id } = await context.params;
  try {
    const body = await request.json();

    if (body.action === "move") {
      const { targetStage, sortOrder } = body;

      if (!targetStage || !isValidStage(targetStage)) {
        return NextResponse.json(
          { error: "VALIDATION", message: `Invalid stage. Must be one of: ${STAGES.join(", ")}` },
          { status: 400 },
        );
      }

      const current = await prisma.progressItem.findUnique({ where: { id } });
      if (!current) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }

      const fromStage = current.stage;

      // Reorder siblings in target stage to make room (atomic transaction)
      const targetSiblings = await prisma.progressItem.findMany({
        where: { businessId: current.businessId, stage: targetStage, id: { not: id } },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });

      const insertAt = Math.min(sortOrder ?? 0, targetSiblings.length);

      const updated = await prisma.$transaction([
        ...targetSiblings.map((s, i) =>
          prisma.progressItem.update({
            where: { id: s.id },
            data: { sortOrder: i >= insertAt ? i + 1 : i },
          })
        ),
        prisma.progressItem.update({
          where: { id },
          data: {
            stage: targetStage,
            sortOrder: insertAt,
            lockVersion: { increment: 1 },
          },
        }),
      ]).then((results) => results[results.length - 1]);

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

    return NextResponse.json({ error: "VALIDATION", message: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("POST progress-item error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Params) {
  const { id } = await context.params;
  try {
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
  } catch (e) {
    console.error("DELETE progress-item error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
