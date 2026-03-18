import { prisma } from "./prisma";

type VersionableEntity =
  | "business"
  | "progressItem"
  | "weeklyAction"
  | "internalNote";

const modelMap = {
  business: "businessVersion",
  progressItem: "progressItemVersion",
  weeklyAction: "weeklyActionVersion",
  internalNote: "internalNoteVersion",
} as const;

const fkMap = {
  business: "businessId",
  progressItem: "progressItemId",
  weeklyAction: "actionId",
  internalNote: "noteId",
} as const;

interface CreateVersionParams {
  entityType: VersionableEntity;
  entityId: string;
  snapshot: Record<string, unknown>;
  createdById?: string | null;
}

export async function createVersionSnapshot({
  entityType,
  entityId,
  snapshot,
  createdById = null,
}: CreateVersionParams) {
  const modelName = modelMap[entityType];
  const fkField = fkMap[entityType];

  // Get the next version number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any)[modelName];
  const lastVersion = await model.findFirst({
    where: { [fkField]: entityId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });

  const nextVersion = (lastVersion?.versionNumber ?? 0) + 1;

  return model.create({
    data: {
      [fkField]: entityId,
      versionNumber: nextVersion,
      snapshot,
      createdById,
    },
  });
}
