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

export async function buildCheckpointPayload(): Promise<CheckpointPayload> {
  const [
    companies,
    companyAliases,
    businesses,
    progressItems,
    weeklyCycles,
    weeklyActions,
    internalNotes,
  ] = await Promise.all([
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
  const serialized = JSON.stringify(payload);
  const byteSize = Buffer.byteLength(serialized, "utf8");

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

export function preRestoreExpiry(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 7);
  return d;
}

export async function cleanupExpiredCheckpoints(): Promise<number> {
  const result = await prisma.weeklyCheckpoint.deleteMany({
    where: {
      kind: "pre_restore",
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}
