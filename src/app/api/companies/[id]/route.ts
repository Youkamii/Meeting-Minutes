import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { checkLockVersion, ConflictError, conflictResponse } from "@/lib/conflict";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Params) {
  const { id } = await context.params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: { aliases: true },
  });

  if (!company) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Company not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: { ...company, aliases: company.aliases.map((a) => a.alias) },
  });
}

export async function PUT(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const body = await request.json();
  const { canonicalName, isKey, aliases, lockVersion } = body;

  const current = await prisma.company.findUnique({
    where: { id },
    include: { aliases: true },
  });

  if (!current) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Company not found" },
      { status: 404 },
    );
  }

  try {
    checkLockVersion(
      current.lockVersion,
      lockVersion,
      { ...current, aliases: current.aliases.map((a) => a.alias) },
      body,
    );
  } catch (e) {
    if (e instanceof ConflictError) return conflictResponse(e);
    throw e;
  }

  const before = {
    canonicalName: current.canonicalName,
    isKey: current.isKey,
    aliases: current.aliases.map((a) => a.alias),
  };

  // Update aliases if provided
  if (aliases !== undefined) {
    await prisma.companyAlias.deleteMany({ where: { companyId: id } });
    if (aliases.length > 0) {
      await prisma.companyAlias.createMany({
        data: aliases
          .filter((a: string) => a.trim())
          .map((alias: string) => ({ companyId: id, alias: alias.trim() })),
      });
    }
  }

  const updated = await prisma.company.update({
    where: { id },
    data: {
      ...(canonicalName !== undefined ? { canonicalName: canonicalName.trim() } : {}),
      ...(isKey !== undefined ? { isKey } : {}),
      lockVersion: { increment: 1 },
    },
    include: { aliases: true },
  });

  await createAuditLog({
    entityType: "company",
    entityId: id,
    action: "update",
    changes: {
      before,
      after: {
        canonicalName: updated.canonicalName,
        isKey: updated.isKey,
        aliases: updated.aliases.map((a) => a.alias),
      },
    },
  });

  return NextResponse.json({
    data: { ...updated, aliases: updated.aliases.map((a) => a.alias) },
  });
}

export async function POST(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const body = await request.json();
  const { action } = body;

  if (action === "archive") {
    const company = await prisma.company.update({
      where: { id },
      data: { isArchived: true, archivedAt: new Date(), lockVersion: { increment: 1 } },
    });
    await createAuditLog({ entityType: "company", entityId: id, action: "delete", summary: "Archived" });
    return NextResponse.json({ data: company });
  }

  if (action === "restore") {
    const company = await prisma.company.update({
      where: { id },
      data: { isArchived: false, archivedAt: null, lockVersion: { increment: 1 } },
    });
    await createAuditLog({ entityType: "company", entityId: id, action: "create", summary: "Restored" });
    return NextResponse.json({ data: company });
  }

  return NextResponse.json(
    { error: "VALIDATION", message: "Unknown action" },
    { status: 400 },
  );
}
