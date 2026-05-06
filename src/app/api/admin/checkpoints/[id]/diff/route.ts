import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { CheckpointPayload } from "@/lib/checkpoint";

interface TableDiff {
  willDelete: number;
  willInsert: number;
  willUpdate: number;
}

type SnapRow = {
  id: string;
  lockVersion?: number | null;
  updatedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

function toIso(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  return v instanceof Date ? v.toISOString() : String(v);
}

/**
 * Compare current and snapshot rows by id, then detect changes using
 * lockVersion → updatedAt → createdAt in that priority order.
 * Returns 0 for willUpdate only when neither side has any version signal.
 */
function diffRows(current: SnapRow[], snapshot: SnapRow[]): TableDiff {
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
    if (cur.lockVersion != null && snap.lockVersion != null) {
      if (cur.lockVersion !== snap.lockVersion) willUpdate++;
    } else if (cur.updatedAt != null && snap.updatedAt != null) {
      if (toIso(cur.updatedAt) !== toIso(snap.updatedAt)) willUpdate++;
    } else if (cur.createdAt != null && snap.createdAt != null) {
      if (toIso(cur.createdAt) !== toIso(snap.createdAt)) willUpdate++;
    }
  }
  let willInsert = 0;
  for (const id of snapMap.keys()) if (!curMap.has(id)) willInsert++;

  return { willDelete, willInsert, willUpdate };
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
  ] = await prisma.$transaction([
    prisma.company.findMany({
      select: { id: true, lockVersion: true, updatedAt: true },
    }),
    prisma.companyAlias.findMany({
      select: { id: true, createdAt: true },
    }),
    prisma.business.findMany({
      select: { id: true, lockVersion: true, updatedAt: true },
    }),
    prisma.progressItem.findMany({
      select: { id: true, lockVersion: true, updatedAt: true },
    }),
    prisma.weeklyCycle.findMany({
      select: { id: true, createdAt: true },
    }),
    prisma.weeklyAction.findMany({
      select: { id: true, lockVersion: true, updatedAt: true },
    }),
    prisma.internalNote.findMany({
      select: { id: true, lockVersion: true, updatedAt: true },
    }),
  ]);

  const diff = {
    companies: diffRows(companies, payload.companies as SnapRow[]),
    companyAliases: diffRows(
      companyAliases,
      payload.companyAliases as SnapRow[],
    ),
    businesses: diffRows(businesses, payload.businesses as SnapRow[]),
    progressItems: diffRows(progressItems, payload.progressItems as SnapRow[]),
    weeklyCycles: diffRows(weeklyCycles, payload.weeklyCycles as SnapRow[]),
    weeklyActions: diffRows(weeklyActions, payload.weeklyActions as SnapRow[]),
    internalNotes: diffRows(internalNotes, payload.internalNotes as SnapRow[]),
  };

  return NextResponse.json({
    data: {
      checkpointId: id,
      takenAt: checkpoint.takenAt,
      diff,
    },
  });
}
