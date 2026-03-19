import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderedIds } = body as { orderedIds: string[] };

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "VALIDATION", message: "orderedIds must be a non-empty array" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.company.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    await createAuditLog({
      entityType: "company",
      entityId: "batch",
      action: "move",
      summary: `Reordered ${orderedIds.length} companies`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/companies/reorder error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
