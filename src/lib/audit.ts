import { NextRequest } from "next/server";
import { prisma } from "./prisma";

export function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

interface CreateAuditLogParams {
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  ip?: string | null;
  changes?: Record<string, unknown> | null;
  summary?: string | null;
}

export async function createAuditLog({
  entityType,
  entityId,
  action,
  actorId = null,
  ip = null,
  changes = null,
  summary = null,
}: CreateAuditLogParams) {
  return prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      actorId,
      ip,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      changes: (changes ?? undefined) as any,
      summary,
    },
  });
}
