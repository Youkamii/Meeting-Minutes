import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createWorkbook, styleHeader, generateFilename, workbookToBuffer } from "@/lib/excel";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "VALIDATION", message: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const { type, ...options } = body;

  if (type === "weekly") {
    return handleWeeklyExport(options);
  } else if (type === "monthly") {
    return handleMonthlyExport(options);
  } else if (type === "current_view") {
    return handleCurrentViewExport(options);
  }

  return NextResponse.json(
    { error: "VALIDATION", message: "type must be weekly, monthly, or current_view" },
    { status: 400 },
  );
}

async function handleWeeklyExport(options: {
  cycleId: string;
  includeCompleted?: boolean;
  includeCarryover?: boolean;
  assignedTo?: string;
}) {
  if (!options.cycleId) {
    return NextResponse.json(
      { error: "VALIDATION", message: "cycleId is required for weekly export" },
      { status: 400 },
    );
  }

  const where = {
    cycleId: options.cycleId,
    isArchived: false,
    ...(options.includeCompleted ? {} : { status: { not: "completed" as const } }),
    ...(options.assignedTo ? { assignedToId: options.assignedTo } : {}),
  };

  const actions = await prisma.weeklyAction.findMany({
    where,
    include: { company: true, business: true, cycle: true },
    orderBy: [{ companyId: "asc" }, { sortOrder: "asc" }],
  });

  const wb = createWorkbook();
  const ws = wb.addWorksheet("Weekly Actions");

  ws.columns = [
    { header: "Company", key: "company", width: 20 },
    { header: "Business", key: "business", width: 20 },
    { header: "Action", key: "content", width: 40 },
    { header: "Status", key: "status", width: 12 },
    { header: "Priority", key: "priority", width: 10 },
    { header: "Carryover", key: "carryover", width: 10 },
  ];

  styleHeader(ws.getRow(1));

  for (const a of actions) {
    ws.addRow({
      company: a.company.canonicalName,
      business: a.business?.name ?? "",
      content: a.content,
      status: a.status,
      priority: a.priority,
      carryover: a.carryoverCount > 0 ? `↻${a.carryoverCount}` : "",
    });
  }

  const filename = generateFilename("weekly");
  const buffer = await workbookToBuffer(wb);

  try {
    await createAuditLog({
      entityType: "export",
      entityId: options.cycleId,
      action: "download",
      changes: { type: "weekly", ...options, filename },
    });
  } catch (e) {
    console.error("Audit log failed (weekly export):", e);
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function handleMonthlyExport(options: {
  year: number;
  month: number;
  includeStageStatus?: boolean;
  includeIncompleteActions?: boolean;
}) {
  const year = Number(options.year);
  const month = Number(options.month);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "VALIDATION", message: "year and month must be valid numbers (month 1-12)" },
      { status: 400 },
    );
  }

  const businesses = await prisma.business.findMany({
    where: { isArchived: false },
    include: {
      company: true,
      progressItems: { orderBy: { stage: "asc" } },
    },
    orderBy: [{ companyId: "asc" }, { sortOrder: "asc" }],
  });

  const wb = createWorkbook();
  const ws = wb.addWorksheet("Monthly Report");

  ws.columns = [
    { header: "Company", key: "company", width: 20 },
    { header: "Business", key: "name", width: 25 },
    { header: "Scale", key: "scale", width: 15 },
    { header: "Timing", key: "timing", width: 15 },
    { header: "Stage", key: "stage", width: 12 },
    { header: "Progress Items", key: "progress", width: 40 },
  ];

  styleHeader(ws.getRow(1));

  for (const b of businesses) {
    ws.addRow({
      company: b.company.canonicalName,
      name: b.name,
      scale: b.scale ?? "",
      timing: b.timingText ?? "",
      stage: b.currentStage ?? "",
      progress: b.progressItems.map((p) => `[${p.stage}] ${p.content}`).join("; "),
    });
  }

  const filename = generateFilename(`monthly_${options.year}-${String(options.month).padStart(2, "0")}`);
  const buffer = await workbookToBuffer(wb);

  try {
    await createAuditLog({
      entityType: "export",
      entityId: `${options.year}-${options.month}`,
      action: "download",
      changes: { type: "monthly", ...options, filename },
    });
  } catch (e) {
    console.error("Audit log failed (monthly export):", e);
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function handleCurrentViewExport(options: {
  view: "business_management" | "weekly_meeting";
}) {
  if (options.view === "business_management") {
    return handleMonthlyExport({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  }
  // Default to weekly for current week
  const cycle = await prisma.weeklyCycle.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!cycle) {
    return NextResponse.json({ error: "NOT_FOUND", message: "No cycle found" }, { status: 404 });
  }
  return handleWeeklyExport({ cycleId: cycle.id, includeCompleted: true });
}
