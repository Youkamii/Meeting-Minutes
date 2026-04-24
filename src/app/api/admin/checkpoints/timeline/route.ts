import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { cleanupExpiredCheckpoints } from "@/lib/checkpoint";

type TimelineEntry =
  | {
      type: "checkpoint";
      at: string;
      id: string;
      kind: "weekly" | "pre_restore";
      label: string | null;
      year: number | null;
      weekNumber: number | null;
      byteSize: number | null;
      expiresAt: string | null;
      createdById: string | null;
      auditCountSincePrev: number;
    }
  | {
      type: "restore";
      at: string;
      id: string;
      restoredCheckpointId: string;
      restoredCheckpointLabel: string | null;
      actorId: string | null;
    };

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Admin role required" },
      { status: 403 },
    );
  }

  await cleanupExpiredCheckpoints();

  const checkpoints = await prisma.weeklyCheckpoint.findMany({
    orderBy: { takenAt: "asc" },
    select: {
      id: true,
      kind: true,
      label: true,
      year: true,
      weekNumber: true,
      byteSize: true,
      takenAt: true,
      expiresAt: true,
      createdById: true,
    },
  });

  const restoreLogs = await prisma.auditLog.findMany({
    where: { entityType: "weekly_checkpoint", action: "restore" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      entityId: true,
      actorId: true,
      createdAt: true,
    },
  });

  // Audit count per interval (this checkpoint .. next checkpoint)
  const counts = new Map<string, number>();
  for (let i = 0; i < checkpoints.length; i++) {
    const start = checkpoints[i].takenAt;
    const end = checkpoints[i + 1]?.takenAt;
    const count = await prisma.auditLog.count({
      where: {
        entityType: { notIn: ["weekly_checkpoint"] },
        createdAt: {
          gt: start,
          ...(end ? { lte: end } : {}),
        },
      },
    });
    counts.set(checkpoints[i].id, count);
  }

  // Resolve restored checkpoint labels
  const labelById = new Map<string, string | null>(
    checkpoints.map((c) => [c.id, c.label]),
  );

  const entries: TimelineEntry[] = [
    ...checkpoints.map(
      (c): TimelineEntry => ({
        type: "checkpoint",
        at: c.takenAt.toISOString(),
        id: c.id,
        kind: c.kind as "weekly" | "pre_restore",
        label: c.label,
        year: c.year,
        weekNumber: c.weekNumber,
        byteSize: c.byteSize,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        createdById: c.createdById,
        auditCountSincePrev: counts.get(c.id) ?? 0,
      }),
    ),
    ...restoreLogs.map(
      (a): TimelineEntry => ({
        type: "restore",
        at: a.createdAt.toISOString(),
        id: a.id,
        restoredCheckpointId: a.entityId,
        restoredCheckpointLabel: labelById.get(a.entityId) ?? null,
        actorId: a.actorId,
      }),
    ),
  ].sort((a, b) => (b.at < a.at ? -1 : b.at > a.at ? 1 : 0));

  return NextResponse.json({ data: entries });
}
