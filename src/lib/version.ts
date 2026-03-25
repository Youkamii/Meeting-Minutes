import { Prisma } from "@prisma/client";
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

type VersionModelName = (typeof modelMap)[VersionableEntity];

type VersionDelegate = {
  findFirst: (args: {
    where: Record<string, unknown>;
    orderBy: Record<string, string>;
    select: Record<string, boolean>;
  }) => Promise<{ versionNumber: number } | null>;
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
};

function getVersionModel(modelName: VersionModelName): VersionDelegate {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegates: Record<VersionModelName, VersionDelegate> = {
    businessVersion: prisma.businessVersion as any,
    progressItemVersion: prisma.progressItemVersion as any,
    weeklyActionVersion: prisma.weeklyActionVersion as any,
    internalNoteVersion: prisma.internalNoteVersion as any,
  };
  return delegates[modelName];
}

interface CreateVersionParams {
  entityType: VersionableEntity;
  entityId: string;
  snapshot: Record<string, unknown>;
  createdById?: string | null;
}

const MAX_RETRIES = 3;

export async function createVersionSnapshot({
  entityType,
  entityId,
  snapshot,
  createdById = null,
}: CreateVersionParams) {
  const modelName = modelMap[entityType];
  const fkField = fkMap[entityType];
  const model = getVersionModel(modelName);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const lastVersion = await model.findFirst({
      where: { [fkField]: entityId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const nextVersion = (lastVersion?.versionNumber ?? 0) + 1;

    try {
      return await model.create({
        data: {
          [fkField]: entityId,
          versionNumber: nextVersion,
          snapshot,
          createdById,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < MAX_RETRIES - 1
      ) {
        // Unique constraint violation — retry with refreshed version number
        continue;
      }
      throw error;
    }
  }
}
