import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { createCheckpoint, cleanupExpiredCheckpoints } from "@/lib/checkpoint";

async function resolveActorId(): Promise<string | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const exists = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  return exists?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Admin role required" },
      { status: 403 },
    );
  }

  // Lazy cleanup of expired pre_restore checkpoints
  await cleanupExpiredCheckpoints();

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");

  const where: { kind?: string } = {};
  if (kind === "weekly" || kind === "pre_restore") {
    where.kind = kind;
  }

  const checkpoints = await prisma.weeklyCheckpoint.findMany({
    where,
    orderBy: { takenAt: "desc" },
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

  return NextResponse.json({ data: checkpoints, total: checkpoints.length });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Admin role required" },
      { status: 403 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // empty body ok
  }

  const label = typeof body.label === "string" ? body.label : null;
  const year = typeof body.year === "number" ? body.year : null;
  const weekNumber = typeof body.weekNumber === "number" ? body.weekNumber : null;

  const createdById = await resolveActorId();

  const checkpoint = await createCheckpoint({
    kind: "weekly",
    label,
    year,
    weekNumber,
    createdById,
  });

  await createAuditLog({
    entityType: "weekly_checkpoint",
    entityId: checkpoint.id,
    action: "create",
    actorId: createdById,
    summary: `Weekly checkpoint created (byteSize=${checkpoint.byteSize})`,
  });

  return NextResponse.json(
    {
      data: {
        id: checkpoint.id,
        kind: checkpoint.kind,
        label: checkpoint.label,
        year: checkpoint.year,
        weekNumber: checkpoint.weekNumber,
        byteSize: checkpoint.byteSize,
        takenAt: checkpoint.takenAt,
        expiresAt: checkpoint.expiresAt,
      },
    },
    { status: 201 },
  );
}
