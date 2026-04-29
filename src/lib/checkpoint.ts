import { prisma } from "./prisma";

export type CheckpointKind = "weekly" | "pre_restore";

export interface CheckpointPayload {
  companies: unknown[];
  companyAliases: unknown[];
  businesses: unknown[];
  progressItems: unknown[];
  weeklyCycles: unknown[];
  weeklyActions: unknown[];
  internalNotes: unknown[];
}

export const CHECKPOINT_TABLES = [
  "companies",
  "companyAliases",
  "businesses",
  "progressItems",
  "weeklyCycles",
  "weeklyActions",
  "internalNotes",
] as const satisfies readonly (keyof CheckpointPayload)[];

/**
 * Tables cleared during restore. Order doesn't matter for TRUNCATE CASCADE,
 * but listed children-first for readability. Includes:
 * - main data tables
 * - per-row version tables (CASCADE'd anyway, but explicit)
 * - recent_views (polymorphic, FK-less — must be explicit to avoid orphans)
 */
export const CHECKPOINT_TRUNCATE_TABLES = [
  "internal_note_versions",
  "weekly_action_versions",
  "progress_item_versions",
  "business_versions",
  "recent_views",
  "internal_notes",
  "weekly_actions",
  "weekly_cycles",
  "progress_items",
  "businesses",
  "company_aliases",
  "companies",
] as const;

export async function buildCheckpointPayload(): Promise<CheckpointPayload> {
  const [
    companies,
    companyAliases,
    businesses,
    progressItems,
    weeklyCycles,
    weeklyActions,
    internalNotes,
  ] = await prisma.$transaction([
    prisma.company.findMany(),
    prisma.companyAlias.findMany(),
    prisma.business.findMany(),
    prisma.progressItem.findMany(),
    prisma.weeklyCycle.findMany(),
    prisma.weeklyAction.findMany(),
    prisma.internalNote.findMany(),
  ]);

  return {
    companies,
    companyAliases,
    businesses,
    progressItems,
    weeklyCycles,
    weeklyActions,
    internalNotes,
  };
}

interface CreateCheckpointParams {
  kind: CheckpointKind;
  label?: string | null;
  year?: number | null;
  weekNumber?: number | null;
  createdById?: string | null;
  expiresAt?: Date | null;
}

export async function createCheckpoint({
  kind,
  label = null,
  year = null,
  weekNumber = null,
  createdById = null,
  expiresAt = null,
}: CreateCheckpointParams) {
  const payload = await buildCheckpointPayload();
  const byteSize = Buffer.byteLength(JSON.stringify(payload), "utf8");

  return prisma.weeklyCheckpoint.create({
    data: {
      kind,
      label,
      year,
      weekNumber,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: payload as any,
      byteSize,
      createdById,
      expiresAt,
    },
  });
}

export const PRE_RESTORE_RETENTION_DAYS = 35;

export function preRestoreExpiry(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + PRE_RESTORE_RETENTION_DAYS);
  return d;
}

/**
 * Delete expired pre_restore checkpoints along with any AuditLogs
 * linked to them via snapshotCheckpointId. Returns counts so the caller
 * can surface how much was pruned.
 */
export async function cleanupExpiredCheckpoints(): Promise<{
  deletedCheckpoints: number;
  deletedOrphanLogs: number;
}> {
  const expired = await prisma.weeklyCheckpoint.findMany({
    where: {
      kind: "pre_restore",
      expiresAt: { lt: new Date() },
    },
    select: { id: true },
  });

  if (expired.length === 0) {
    return { deletedCheckpoints: 0, deletedOrphanLogs: 0 };
  }

  const ids = expired.map((c) => c.id);

  const [logResult, ckptResult] = await prisma.$transaction([
    prisma.auditLog.deleteMany({
      where: { snapshotCheckpointId: { in: ids } },
    }),
    prisma.weeklyCheckpoint.deleteMany({
      where: { id: { in: ids } },
    }),
  ]);

  return {
    deletedCheckpoints: ckptResult.count,
    deletedOrphanLogs: logResult.count,
  };
}
