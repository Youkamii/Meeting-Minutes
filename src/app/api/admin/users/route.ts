import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { VALID_ROLES, VALID_STATUSES, isValidRole, isValidStatus } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Admin role required" },
      { status: 403 },
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: users, total: users.length });
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Admin role required" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { id, role, status } = body;

  if (!id) {
    return NextResponse.json(
      { error: "VALIDATION", message: "id is required" },
      { status: 400 },
    );
  }

  if (role !== undefined && !isValidRole(role)) {
    return NextResponse.json(
      { error: "VALIDATION", message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 400 },
    );
  }
  if (status !== undefined && !isValidStatus(status)) {
    return NextResponse.json(
      { error: "VALIDATION", message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const current = await prisma.user.findUnique({ where: { id } });

  if (!current) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "User not found" },
      { status: 404 },
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(role !== undefined ? { role } : {}),
      ...(status !== undefined ? { status } : {}),
    },
  });

  if (role !== undefined && role !== current.role) {
    await createAuditLog({
      entityType: "user",
      entityId: id,
      action: "role_change",
      changes: { before: { role: current.role }, after: { role } },
    });
  }

  if (status !== undefined && status !== current.status) {
    await createAuditLog({
      entityType: "user",
      entityId: id,
      action: "status_change",
      changes: { before: { status: current.status }, after: { status } },
    });
  }

  return NextResponse.json({ data: updated });
}
