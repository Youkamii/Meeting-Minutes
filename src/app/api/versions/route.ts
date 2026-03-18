import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type EntityType = "business" | "progressItem" | "weeklyAction" | "internalNote";

function getVersionModel(entityType: EntityType) {
  const map = {
    business: prisma.businessVersion,
    progressItem: prisma.progressItemVersion,
    weeklyAction: prisma.weeklyActionVersion,
    internalNote: prisma.internalNoteVersion,
  } as const;
  return map[entityType] ?? null;
}

function getForeignKey(entityType: EntityType): string {
  const map: Record<EntityType, string> = {
    business: "businessId",
    progressItem: "progressItemId",
    weeklyAction: "actionId",
    internalNote: "noteId",
  };
  return map[entityType];
}

function getEntityModel(entityType: EntityType) {
  const map = {
    business: prisma.business,
    progressItem: prisma.progressItem,
    weeklyAction: prisma.weeklyAction,
    internalNote: prisma.internalNote,
  } as const;
  return map[entityType] ?? null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entity_type") as EntityType | null;
  const entityId = searchParams.get("entity_id");
  const versionA = searchParams.get("version_a");
  const versionB = searchParams.get("version_b");

  if (!entityType) {
    return NextResponse.json(
      { error: "VALIDATION", message: "entity_type is required" },
      { status: 400 },
    );
  }

  const model = getVersionModel(entityType);
  if (!model) {
    return NextResponse.json(
      { error: "VALIDATION", message: "Invalid entity_type" },
      { status: 400 },
    );
  }

  // Diff mode: compare two versions
  if (versionA && versionB) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [a, b] = await Promise.all([
      (model as any).findUnique({ where: { id: versionA } }),
      (model as any).findUnique({ where: { id: versionB } }),
    ]);

    if (!a || !b) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "One or both versions not found" },
        { status: 404 },
      );
    }

    const snapA = a.snapshot as Record<string, unknown>;
    const snapB = b.snapshot as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(snapA), ...Object.keys(snapB)]);
    const diff: Record<string, { before: unknown; after: unknown }> = {};

    for (const key of allKeys) {
      if (JSON.stringify(snapA[key]) !== JSON.stringify(snapB[key])) {
        diff[key] = { before: snapA[key], after: snapB[key] };
      }
    }

    return NextResponse.json({
      data: {
        versionA: a,
        versionB: b,
        diff,
      },
    });
  }

  // List mode
  if (!entityId) {
    return NextResponse.json(
      { error: "VALIDATION", message: "entity_id is required" },
      { status: 400 },
    );
  }

  const fk = getForeignKey(entityType);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const versions = await (model as any).findMany({
    where: { [fk]: entityId },
    orderBy: { versionNumber: "desc" },
  });

  return NextResponse.json({ data: versions, total: versions.length });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { versionId, entityType } = body as {
    versionId: string;
    entityType: EntityType;
  };

  if (!versionId || !entityType) {
    return NextResponse.json(
      { error: "VALIDATION", message: "versionId and entityType are required" },
      { status: 400 },
    );
  }

  const versionModel = getVersionModel(entityType);
  const entityModel = getEntityModel(entityType);
  if (!versionModel || !entityModel) {
    return NextResponse.json(
      { error: "VALIDATION", message: "Invalid entityType" },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const version = await (versionModel as any).findUnique({
    where: { id: versionId },
  });

  if (!version) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Version not found" },
      { status: 404 },
    );
  }

  const snapshot = version.snapshot as Record<string, unknown>;
  const fk = getForeignKey(entityType);
  const entityId = version[fk] as string;

  // Remove fields that shouldn't be restored directly
  const { id: _id, createdAt: _ca, updatedAt: _ua, lockVersion: _lv, ...restoreData } = snapshot;

  // Update the entity with snapshot data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (entityModel as any).update({
    where: { id: entityId },
    data: { ...restoreData, lockVersion: { increment: 1 } },
  });

  // Find max version number and create new version
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latest = await (versionModel as any).findFirst({
    where: { [fk]: entityId },
    orderBy: { versionNumber: "desc" },
  });

  const nextVersion = (latest?.versionNumber ?? 0) + 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (versionModel as any).create({
    data: {
      [fk]: entityId,
      versionNumber: nextVersion,
      snapshot: JSON.parse(JSON.stringify(updated)),
    },
  });

  return NextResponse.json({ data: updated });
}
