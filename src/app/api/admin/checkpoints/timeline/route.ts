import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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

  const [checkpoints, restoreLogs, auditTimes] = await prisma.$transaction([
    prisma.weeklyCheckpoint.findMany({
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
    }),
    prisma.auditLog.findMany({
      where: { entityType: "weekly_checkpoint", action: "restore" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        entityId: true,
        actorId: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: { entityType: { not: "weekly_checkpoint" } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  // Count audit events per interval [checkpoint_i, checkpoint_{i+1})
  // using a single pass through the pre-sorted audit log timestamps.
  const counts = new Map<string, number>();
  let logIdx = 0;
  for (let i = 0; i < checkpoints.length; i++) {
    const start = checkpoints[i].takenAt.getTime();
    const end = checkpoints[i + 1]?.takenAt.getTime();
    while (
      logIdx < auditTimes.length &&
      auditTimes[logIdx].createdAt.getTime() <= start
    ) {
      logIdx++;
    }
    let count = 0;
    while (
      logIdx < auditTimes.length &&
      (end === undefined ||
        auditTimes[logIdx].createdAt.getTime() <= end)
    ) {
      count++;
      logIdx++;
    }
    counts.set(checkpoints[i].id, count);
  }

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
  ].sort((a, b) => {
    // desc by timestamp; on tie, restore goes on top (more recent conceptually)
    if (a.at !== b.at) return b.at < a.at ? -1 : 1;
    if (a.type === b.type) return 0;
    return a.type === "restore" ? -1 : 1;
  });

  return NextResponse.json({ data: entries });
}
