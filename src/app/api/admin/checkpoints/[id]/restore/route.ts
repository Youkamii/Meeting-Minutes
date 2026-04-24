import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { auth, requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import {
  buildCheckpointPayload,
  preRestoreExpiry,
  CHECKPOINT_TRUNCATE_TABLES,
  type CheckpointPayload,
} from "@/lib/checkpoint";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

const USER_REF_FIELDS: Record<keyof CheckpointPayload, string[]> = {
  companies: ["createdById", "updatedById"],
  companyAliases: [],
  businesses: ["createdById", "updatedById", "assignedToId"],
  progressItems: ["createdById", "updatedById"],
  weeklyCycles: [],
  weeklyActions: ["createdById", "updatedById", "assignedToId"],
  internalNotes: ["createdById", "updatedById"],
};

/** AuditLog.entityType → CheckpointPayload key */
const AUDIT_ENTITY_TO_PAYLOAD_KEY: Record<string, keyof CheckpointPayload> = {
  company: "companies",
  business: "businesses",
  progress_item: "progressItems",
  weekly_action: "weeklyActions",
  internal_note: "internalNotes",
};

function collectIds(
  payload: CheckpointPayload,
  key: keyof CheckpointPayload,
): Set<string> {
  const rows = payload[key] as Array<{ id?: unknown }>;
  const out = new Set<string>();
  for (const r of rows) if (typeof r?.id === "string") out.add(r.id);
  return out;
}

/**
 * Point AuditLogs of rows that disappear in the restore to the pre_restore
 * snapshot so orphan entityIds remain resolvable until the snapshot expires.
 */
async function linkOrphanAuditLogs(
  preRestoreId: string,
  before: CheckpointPayload,
  after: CheckpointPayload,
): Promise<number> {
  let updated = 0;
  for (const [entityType, payloadKey] of Object.entries(
    AUDIT_ENTITY_TO_PAYLOAD_KEY,
  )) {
    const beforeIds = collectIds(before, payloadKey);
    const afterIds = collectIds(after, payloadKey);
    const disappearing = [...beforeIds].filter((id) => !afterIds.has(id));
    if (disappearing.length === 0) continue;
    const result = await prisma.auditLog.updateMany({
      where: {
        entityType,
        entityId: { in: disappearing },
        snapshotCheckpointId: null,
      },
      data: { snapshotCheckpointId: preRestoreId },
    });
    updated += result.count;
  }
  return updated;
}

function sanitizeUserRefs<T extends Record<string, unknown>>(
  rows: T[],
  fields: string[],
  validUserIds: Set<string>,
): T[] {
  if (fields.length === 0) return rows;
  return rows.map((row) => {
    const out: Record<string, unknown> = { ...row };
    for (const f of fields) {
      const v = out[f];
      if (typeof v === "string" && !validUserIds.has(v)) {
        out[f] = null;
      }
    }
    return out as T;
  });
}

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

export async function POST(
  request: NextRequest,
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
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // empty body
  }

  if (body.confirmText !== "RESTORE") {
    return NextResponse.json(
      { error: "VALIDATION", message: "confirmText must equal 'RESTORE'" },
      { status: 400 },
    );
  }
  const appPassword = process.env.APP_PASSWORD;
  if (
    !appPassword ||
    typeof body.password !== "string" ||
    !safeEqual(body.password, appPassword)
  ) {
    return NextResponse.json(
      { error: "VALIDATION", message: "Invalid password" },
      { status: 400 },
    );
  }

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
  const actorId = await resolveActorId();

  // 1. Save current state as pre_restore snapshot (expires per PRE_RESTORE_RETENTION_DAYS)
  const currentPayload = await buildCheckpointPayload();
  const preRestore = await prisma.weeklyCheckpoint.create({
    data: {
      kind: "pre_restore",
      label: `Before restore of ${checkpoint.label ?? checkpoint.id}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: currentPayload as any,
      byteSize: Buffer.byteLength(JSON.stringify(currentPayload), "utf8"),
      expiresAt: preRestoreExpiry(),
      createdById: actorId,
    },
  });

  // 1-B. Link AuditLogs of disappearing rows to the pre_restore snapshot
  const orphanCount = await linkOrphanAuditLogs(
    preRestore.id,
    currentPayload,
    payload,
  );

  // 2. Collect valid user ids for FK sanitization
  const users = await prisma.user.findMany({ select: { id: true } });
  const validUserIds = new Set(users.map((u) => u.id));

  // 3. Single transaction: TRUNCATE CASCADE + re-insert in FK order
  try {
    await prisma.$transaction(
      async (tx) => {
        const truncateSql = `TRUNCATE TABLE ${CHECKPOINT_TRUNCATE_TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`;
        await tx.$executeRawUnsafe(truncateSql);

        const companies = sanitizeUserRefs(
          payload.companies as Array<Record<string, unknown>>,
          USER_REF_FIELDS.companies,
          validUserIds,
        );
        if (companies.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.company.createMany({ data: companies as any });
        }

        const companyAliases = payload.companyAliases as Array<
          Record<string, unknown>
        >;
        if (companyAliases.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.companyAlias.createMany({ data: companyAliases as any });
        }

        const businesses = sanitizeUserRefs(
          payload.businesses as Array<Record<string, unknown>>,
          USER_REF_FIELDS.businesses,
          validUserIds,
        );
        if (businesses.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.business.createMany({ data: businesses as any });
        }

        const progressItems = sanitizeUserRefs(
          payload.progressItems as Array<Record<string, unknown>>,
          USER_REF_FIELDS.progressItems,
          validUserIds,
        );
        if (progressItems.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.progressItem.createMany({ data: progressItems as any });
        }

        const weeklyCycles = payload.weeklyCycles as Array<
          Record<string, unknown>
        >;
        if (weeklyCycles.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.weeklyCycle.createMany({ data: weeklyCycles as any });
        }

        const weeklyActions = sanitizeUserRefs(
          payload.weeklyActions as Array<Record<string, unknown>>,
          USER_REF_FIELDS.weeklyActions,
          validUserIds,
        );
        if (weeklyActions.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.weeklyAction.createMany({ data: weeklyActions as any });
        }

        const internalNotes = sanitizeUserRefs(
          payload.internalNotes as Array<Record<string, unknown>>,
          USER_REF_FIELDS.internalNotes,
          validUserIds,
        );
        if (internalNotes.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.internalNote.createMany({ data: internalNotes as any });
        }
      },
      { timeout: 60_000 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "RESTORE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
        preRestoreCheckpointId: preRestore.id,
      },
      { status: 500 },
    );
  }

  await createAuditLog({
    entityType: "weekly_checkpoint",
    entityId: checkpoint.id,
    action: "restore",
    actorId,
    summary: `Restored from checkpoint ${checkpoint.id}. Pre-restore: ${preRestore.id}. Orphan logs linked: ${orphanCount}`,
    changes: { preRestoreCheckpointId: preRestore.id, orphanCount },
  });

  return NextResponse.json({
    data: {
      checkpointId: checkpoint.id,
      preRestoreCheckpointId: preRestore.id,
      orphanLogsLinked: orphanCount,
      restoredAt: new Date().toISOString(),
    },
  });
}
