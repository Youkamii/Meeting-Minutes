import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { CheckpointPayload } from "@/lib/checkpoint";

interface TableDiff {
  willDelete: number;
  willInsert: number;
  willUpdate: number;
}

type SnapRow = { id: string; lockVersion?: number };

function diffByIdAndVersion(
  current: SnapRow[],
  snapshot: SnapRow[],
): TableDiff {
  const snapMap = new Map(snapshot.map((r) => [r.id, r]));
  const curMap = new Map(current.map((r) => [r.id, r]));

  let willDelete = 0;
  let willUpdate = 0;
  for (const [id, cur] of curMap) {
    const snap = snapMap.get(id);
    if (!snap) {
      willDelete++;
      continue;
    }
    if (
      cur.lockVersion !== undefined &&
      snap.lockVersion !== undefined &&
      cur.lockVersion !== snap.lockVersion
    ) {
      willUpdate++;
    }
  }
  let willInsert = 0;
  for (const id of snapMap.keys()) if (!curMap.has(id)) willInsert++;

  return { willDelete, willInsert, willUpdate };
}

function diffById(current: SnapRow[], snapshot: SnapRow[]): TableDiff {
  const snapIds = new Set(snapshot.map((r) => r.id));
  const curIds = new Set(current.map((r) => r.id));
  let willDelete = 0;
  for (const id of curIds) if (!snapIds.has(id)) willDelete++;
  let willInsert = 0;
  for (const id of snapIds) if (!curIds.has(id)) willInsert++;
  return { willDelete, willInsert, willUpdate: 0 };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Admin role required" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const checkpoint = await prisma.weeklyCheckpoint.findUnique({
    where: { id },
  });
  if (!checkpoint) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Checkpoint not found" },
      { status: 404 },
    );
  }

  const payload = checkpoint.payload as unknown as CheckpointPayload;

  const [
    companies,
    companyAliases,
    businesses,
    progressItems,
    weeklyCycles,
    weeklyActions,
    internalNotes,
  ] = await Promise.all([
    prisma.company.findMany({ select: { id: true, lockVersion: true } }),
    prisma.companyAlias.findMany({ select: { id: true } }),
    prisma.business.findMany({ select: { id: true, lockVersion: true } }),
    prisma.progressItem.findMany({ select: { id: true, lockVersion: true } }),
    prisma.weeklyCycle.findMany({ select: { id: true } }),
    prisma.weeklyAction.findMany({ select: { id: true, lockVersion: true } }),
    prisma.internalNote.findMany({ select: { id: true, lockVersion: true } }),
  ]);

  const diff = {
    companies: diffByIdAndVersion(companies, payload.companies as SnapRow[]),
    companyAliases: diffById(companyAliases, payload.companyAliases as SnapRow[]),
    businesses: diffByIdAndVersion(businesses, payload.businesses as SnapRow[]),
    progressItems: diffByIdAndVersion(
      progressItems,
      payload.progressItems as SnapRow[],
    ),
    weeklyCycles: diffById(weeklyCycles, payload.weeklyCycles as SnapRow[]),
    weeklyActions: diffByIdAndVersion(
      weeklyActions,
      payload.weeklyActions as SnapRow[],
    ),
    internalNotes: diffByIdAndVersion(
      internalNotes,
      payload.internalNotes as SnapRow[],
    ),
  };

  return NextResponse.json({
    data: {
      checkpointId: id,
      takenAt: checkpoint.takenAt,
      diff,
    },
  });
}
