import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Admin role required" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { canonical_id, merge_ids } = body as {
    canonical_id: string;
    merge_ids: string[];
  };

  if (!canonical_id || !merge_ids?.length) {
    return NextResponse.json(
      { error: "VALIDATION", message: "canonical_id and merge_ids are required" },
      { status: 400 },
    );
  }

  if (merge_ids.includes(canonical_id)) {
    return NextResponse.json(
      { error: "VALIDATION", message: "canonical_id must not be in merge_ids" },
      { status: 400 },
    );
  }

  const canonical = await prisma.company.findUnique({
    where: { id: canonical_id },
    include: { aliases: true },
  });

  if (!canonical) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Canonical company not found" },
      { status: 404 },
    );
  }

  const mergeCompanies = await prisma.company.findMany({
    where: { id: { in: merge_ids } },
    include: { aliases: true },
  });

  if (mergeCompanies.length !== merge_ids.length) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "One or more merge companies not found" },
      { status: 404 },
    );
  }

  // Re-link businesses and weekly_actions, create aliases, delete merged companies
  for (const company of mergeCompanies) {
    await prisma.business.updateMany({
      where: { companyId: company.id },
      data: { companyId: canonical_id },
    });

    await prisma.weeklyAction.updateMany({
      where: { companyId: company.id },
      data: { companyId: canonical_id },
    });

    // Create alias for the merged company's canonical name
    await prisma.companyAlias.create({
      data: { companyId: canonical_id, alias: company.canonicalName },
    }).catch(() => {
      // Ignore duplicate alias
    });

    // Move existing aliases to canonical company
    for (const alias of company.aliases) {
      await prisma.companyAlias.create({
        data: { companyId: canonical_id, alias: alias.alias },
      }).catch(() => {
        // Ignore duplicate alias
      });
    }

    // Delete aliases of merged company first (cascade should handle, but be explicit)
    await prisma.companyAlias.deleteMany({ where: { companyId: company.id } });

    await prisma.company.delete({ where: { id: company.id } });
  }

  await createAuditLog({
    entityType: "company",
    entityId: canonical_id,
    action: "merge",
    summary: `Merged ${mergeCompanies.map((c) => c.canonicalName).join(", ")} into ${canonical.canonicalName}`,
    changes: {
      merged_ids: merge_ids,
      merged_names: mergeCompanies.map((c) => c.canonicalName),
    },
  });

  // Return merged company with counts
  const result = await prisma.company.findUnique({
    where: { id: canonical_id },
    include: {
      aliases: true,
      _count: { select: { businesses: true, actions: true } },
    },
  });

  return NextResponse.json({
    data: {
      ...result,
      aliases: result!.aliases.map((a) => a.alias),
      businessCount: result!._count.businesses,
      actionCount: result!._count.actions,
    },
  });
}
