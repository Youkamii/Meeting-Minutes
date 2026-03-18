import { prisma } from "./prisma";

interface CreateAuditLogParams {
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  changes?: Record<string, unknown> | null;
  summary?: string | null;
}

export async function createAuditLog({
  entityType,
  entityId,
  action,
  actorId = null,
  changes = null,
  summary = null,
}: CreateAuditLogParams) {
  return prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      actorId,
      changes: changes ? JSON.parse(JSON.stringify(changes)) : undefined,
      summary,
    },
  });
}
