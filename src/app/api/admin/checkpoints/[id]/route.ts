import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

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

export async function DELETE(
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
  const existing = await prisma.weeklyCheckpoint.findUnique({
    where: { id },
    select: { id: true, kind: true, label: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Checkpoint not found" },
      { status: 404 },
    );
  }

  await prisma.weeklyCheckpoint.delete({ where: { id } });

  const actorId = await resolveActorId();
  await createAuditLog({
    entityType: "weekly_checkpoint",
    entityId: id,
    action: "delete",
    actorId,
    summary: `Checkpoint deleted (kind=${existing.kind}, label=${existing.label ?? "-"})`,
  });

  return NextResponse.json({ data: { id } });
}
