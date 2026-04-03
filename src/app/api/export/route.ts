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
    return handleWeeklyExport(options as { cycleId: string; includeCompleted?: boolean; includeCarryover?: boolean; assignedTo?: string });
  } else if (type === "monthly") {
    return handleMonthlyExport(options as { year: number; month: number; includeStageStatus?: boolean; includeIncompleteActions?: boolean });
  } else if (type === "current_view") {
    return handleCurrentViewExport(options as { view: "business_management" | "weekly_meeting" });
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

const STAGE_COLUMNS: { key: string; label: string }[] = [
  { key: "inbound", label: "Inbound(초도미팅)" },
  { key: "funnel", label: "Funnel" },
  { key: "pipeline", label: "PipeLine" },
  { key: "proposal", label: "제안" },
  { key: "contract", label: "계약" },
  { key: "build", label: "구축" },
  { key: "maintenance", label: "유지보수" },
];

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

  const companies = await prisma.company.findMany({
    where: { isArchived: false },
    include: {
      businesses: {
        where: { isArchived: false },
        include: { progressItems: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const wb = createWorkbook();
  const ws = wb.addWorksheet("사업관리");

  // Column widths: 공개여부, 고객사명, 사업명, 사업시기, 사업규모, 7 stages
  ws.columns = [
    { width: 12 },  // A: 공개여부
    { width: 20 },  // B: 고객사명
    { width: 30 },  // C: 사업명
    { width: 15 },  // D: 사업시기
    { width: 12 },  // E: 사업규모
    { width: 30 },  // F: Inbound
    { width: 25 },  // G: Funnel
    { width: 25 },  // H: PipeLine
    { width: 25 },  // I: 제안
    { width: 20 },  // J: 계약
    { width: 20 },  // K: 구축
    { width: 20 },  // L: 유지보수
  ];

  // Row 1: Title
  const titleRow = ws.addRow(["사업관리"]);
  titleRow.getCell(1).font = { bold: true, size: 14 };

  // Row 2: Empty
  ws.addRow([]);

  // Row 3: Main headers with merged "Progress Status"
  const headerRow = ws.addRow([
    "공개여부", "고객사명", "사업명", "사업시기", "사업규모",
    "Progress Status", "", "", "", "", "", "",
  ]);
  ws.mergeCells(3, 6, 3, 12); // Merge F3:L3 for "Progress Status"

  // Row 4: Sub-headers for stages
  const subHeaderRow = ws.addRow([
    "", "", "", "", "",
    ...STAGE_COLUMNS.map((s) => s.label),
  ]);

  // Style header rows
  const headerFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFE8E8E8" } };
  const headerFont = { bold: true, size: 11 };
  const thinBorder = {
    top: { style: "thin" as const },
    bottom: { style: "thin" as const },
    left: { style: "thin" as const },
    right: { style: "thin" as const },
  };

  for (const row of [headerRow, subHeaderRow]) {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 12) {
        cell.font = headerFont;
        cell.fill = headerFill;
        cell.border = thinBorder;
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  }

  // Data rows
  for (const company of companies) {
    if (company.businesses.length === 0) {
      // Company with no businesses: just show company name
      const row = ws.addRow([
        "공개", company.canonicalName, "", "", "",
        "", "", "", "", "", "", "",
      ]);
      applyDataBorder(row);
    } else {
      for (const biz of company.businesses) {
        const stageData: string[] = STAGE_COLUMNS.map((s) => {
          const items = biz.progressItems.filter((p) => p.stage === s.key);
          return items.map((p) => p.content).join("\n");
        });

        const row = ws.addRow([
          biz.visibility === "private" ? "비공개" : "공개",
          company.canonicalName,
          biz.name,
          biz.timingText ?? "",
          biz.scale ?? "",
          ...stageData,
        ]);

        // Enable text wrap for stage cells
        for (let col = 6; col <= 12; col++) {
          row.getCell(col).alignment = { wrapText: true, vertical: "top" };
        }
        applyDataBorder(row);
      }
    }
  }

  const filename = generateFilename(`사업관리_${options.year}-${String(options.month).padStart(2, "0")}`);
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
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}

function applyDataBorder(row: import("exceljs").Row) {
  const thinBorder = {
    top: { style: "thin" as const },
    bottom: { style: "thin" as const },
    left: { style: "thin" as const },
    right: { style: "thin" as const },
  };
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= 12) {
      cell.border = thinBorder;
      cell.alignment = { ...cell.alignment, vertical: "top" };
    }
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
