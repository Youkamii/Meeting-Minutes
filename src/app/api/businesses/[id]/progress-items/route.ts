import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { createVersionSnapshot } from "@/lib/version";
import { STAGES, isValidStage } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Params) {
  const { id: businessId } = await context.params;

  const items = await prisma.progressItem.findMany({
    where: { businessId },
    orderBy: [{ stage: "asc" }, { sortOrder: "asc" }],
  });

  // Group by stage
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    if (!grouped[item.stage]) grouped[item.stage] = [];
    grouped[item.stage].push(item);
  }

  return NextResponse.json({ data: grouped });
}

export async function POST(request: NextRequest, context: Params) {
  const { id: businessId } = await context.params;
  const body = await request.json();
  const { stage, title, content, date, sortOrder } = body;

  if (!stage) {
    return NextResponse.json(
      { error: "VALIDATION", message: "stage is required" },
      { status: 400 },
    );
  }

  if (!isValidStage(stage)) {
    return NextResponse.json(
      { error: "VALIDATION", message: `Invalid stage "${stage}". Must be one of: ${STAGES.join(", ")}` },
      { status: 400 },
    );
  }

  const trimmedTitle = title?.trim() ?? "";
  const trimmedContent = content?.trim() ?? "";
  if (!trimmedTitle && !trimmedContent) {
    return NextResponse.json(
      { error: "VALIDATION", message: "At least one of title or content must be non-empty" },
      { status: 400 },
    );
  }

  const maxSort = await prisma.progressItem.aggregate({
    where: { businessId, stage },
    _max: { sortOrder: true },
  });

  const item = await prisma.progressItem.create({
    data: {
      businessId,
      stage,
      title: trimmedTitle,
      content: trimmedContent,
      date: date || new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date()),
      sortOrder: sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  await createVersionSnapshot({
    entityType: "progressItem",
    entityId: item.id,
    snapshot: JSON.parse(JSON.stringify(item)),
  });

  await createAuditLog({
    entityType: "progress_item",
    entityId: item.id,
    action: "create",
    ip: getClientIp(request),
    changes: { businessId, stage, title: trimmedTitle, content: trimmedContent },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
