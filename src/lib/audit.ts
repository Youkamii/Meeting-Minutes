import "server-only";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

// x-forwarded-for is trusted only behind a reverse proxy (e.g. Vercel).
// In local dev (no proxy) this returns null; in production behind Vercel it
// returns the actual client IP (the platform sets x-forwarded-for itself, so
// values cannot be spoofed by clients).
// Truncate to 45 chars (max IPv6 length) to prevent oversized header injection.
export function getClientIp(request: NextRequest): string | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    null;
  return ip ? ip.slice(0, 45) : null;
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
