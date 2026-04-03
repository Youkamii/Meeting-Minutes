import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createWorkbook, generateFilename, workbookToBuffer } from "@/lib/excel";
import { createAuditLog } from "@/lib/audit";
import { getWeeksInMonth } from "@/lib/weekly-cycle";
import type ExcelJS from "exceljs";

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
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

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" },
};

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE8E8E8" },
};

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

  if (type === "monthly") {
    return handleMonthlyExport(options as { year: number; month: number });
  } else if (type === "yearly") {
    return handleYearlyExport(options as { year: number });
  }

  return NextResponse.json(
    { error: "VALIDATION", message: "type must be monthly or yearly" },
    { status: 400 },
  );
}

// ── 사업관리 시트 (공통) ──────────────────────────────────────

function buildBusinessSheet(ws: ExcelJS.Worksheet, companies: CompanyWithBiz[]) {
  ws.columns = [
    { width: 12 }, { width: 22 }, { width: 30 }, { width: 15 }, { width: 12 },
    { width: 30 }, { width: 25 }, { width: 25 }, { width: 25 }, { width: 20 }, { width: 20 }, { width: 20 },
  ];

  // Row 1: Header row 1 — A~E merged down, F~L merged across
  const h1 = ws.addRow(["공개여부", "고객사명", "사업명", "사업시기", "사업규모", "Progress Status", "", "", "", "", "", ""]);
  // Row 2: Header row 2 — stage sub-headers
  const h2 = ws.addRow(["", "", "", "", "", ...STAGE_COLUMNS.map((s) => s.label)]);

  // Merge header cells
  ws.mergeCells("F1:L1");
  for (let col = 1; col <= 5; col++) {
    ws.mergeCells(1, col, 2, col);
  }

  // Style headers
  for (const row of [h1, h2]) {
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      if (colNum <= 12) {
        cell.font = { bold: true, size: 11 };
        cell.fill = HEADER_FILL;
        cell.border = THIN_BORDER;
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  }

  // Data rows
  for (const company of companies) {
    if (company.businesses.length === 0) {
      const row = ws.addRow(["공개", company.canonicalName, "", "", "", "", "", "", "", "", "", ""]);
      applyDataBorder(row);
    } else {
      for (const biz of company.businesses) {
        const stageData = STAGE_COLUMNS.map((s) => {
          const items = biz.progressItems.filter((p: { stage: string }) => p.stage === s.key);
          return items.map((p: { content: string }) => stripHtml(p.content)).join("\n");
        });

        const row = ws.addRow([
          biz.visibility === "private" ? "비공개" : "공개",
          company.canonicalName,
          biz.name,
          biz.timingText ?? "",
          biz.scale ?? "",
          ...stageData,
        ]);

        for (let col = 6; col <= 12; col++) {
          row.getCell(col).alignment = { wrapText: true, vertical: "top" };
        }
        applyDataBorder(row);
      }
    }
  }
}

// ── 주간회의 시트 (공통) ──────────────────────────────────────

function buildWeeklySheet(
  ws: ExcelJS.Worksheet,
  companies: { id: string; canonicalName: string }[],
  weekLabels: string[],
  cycleIds: string[],
  actionsByCycleCompany: Map<string, string[]>,
  rowsPerCompany: number,
) {
  const colCount = 1 + weekLabels.length;
  ws.columns = [
    { width: 22 },
    ...weekLabels.map(() => ({ width: 40 })),
  ];

  // Row 1: Header row 1
  const h1 = ws.addRow(["구분", ...weekLabels]);
  // Row 2: Header row 2
  const h2 = ws.addRow(["고객사", ...weekLabels.map(() => "TASK/이슈사항")]);

  for (const row of [h1, h2]) {
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      if (colNum <= colCount) {
        cell.font = { bold: true, size: 11 };
        cell.fill = HEADER_FILL;
        cell.border = THIN_BORDER;
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  }

  // Data rows — each company gets `rowsPerCompany` rows, A column merged
  for (const company of companies) {
    const startRow = ws.rowCount + 1;
    for (let r = 0; r < rowsPerCompany; r++) {
      const rowData: string[] = [r === 0 ? company.canonicalName : ""];
      for (let w = 0; w < cycleIds.length; w++) {
        const key = `${cycleIds[w]}_${company.id}`;
        const actions = actionsByCycleCompany.get(key) ?? [];
        rowData.push(actions[r] ?? "");
      }
      const row = ws.addRow(rowData);
      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        if (colNum <= colCount) {
          cell.border = THIN_BORDER;
          cell.alignment = { wrapText: true, vertical: "top" };
        }
      });
    }
    if (rowsPerCompany > 1) {
      ws.mergeCells(startRow, 1, startRow + rowsPerCompany - 1, 1);
      ws.getCell(startRow, 1).alignment = { vertical: "middle" };
    }
  }
}

// ── 월간 Export ───────────────────────────────────────────────

async function handleMonthlyExport(options: { year: number; month: number }) {
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

  // Sheet 1: 사업관리
  buildBusinessSheet(wb.addWorksheet("사업관리"), companies);

  // Sheet 2: 주간회의
  const weeks = getWeeksInMonth(year, month);
  const weekLabels = weeks.map((w) => `${month}월 ${w.weekInMonth}주`);

  const cycles = await prisma.weeklyCycle.findMany({
    where: {
      OR: weeks.map((w) => ({ year: w.year, weekNumber: w.weekNumber })),
    },
  });

  const cycleMap = new Map(cycles.map((c) => [`${c.year}-${c.weekNumber}`, c.id]));
  const cycleIds = weeks.map((w) => cycleMap.get(`${w.year}-${w.weekNumber}`) ?? "");
  const validCycleIds = cycleIds.filter(Boolean);

  const actions = validCycleIds.length > 0
    ? await prisma.weeklyAction.findMany({
        where: { cycleId: { in: validCycleIds }, isArchived: false },
        orderBy: [{ companyId: "asc" }, { sortOrder: "asc" }],
      })
    : [];

  // Group actions by cycle+company
  const actionsByCycleCompany = new Map<string, string[]>();
  for (const a of actions) {
    const key = `${a.cycleId}_${a.companyId}`;
    if (!actionsByCycleCompany.has(key)) actionsByCycleCompany.set(key, []);
    actionsByCycleCompany.get(key)!.push(stripHtml(a.content));
  }

  // Max actions per company across all cycles (minimum 4 rows like reference)
  const companiesForWeekly = companies.map((c) => ({ id: c.id, canonicalName: c.canonicalName }));
  let maxActions = 4;
  for (const company of companiesForWeekly) {
    for (const cid of validCycleIds) {
      const key = `${cid}_${company.id}`;
      const count = actionsByCycleCompany.get(key)?.length ?? 0;
      if (count > maxActions) maxActions = count;
    }
  }

  buildWeeklySheet(
    wb.addWorksheet("주간회의"),
    companiesForWeekly,
    weekLabels,
    cycleIds,
    actionsByCycleCompany,
    maxActions,
  );

  const filename = generateFilename(`사업관리_${year}-${String(month).padStart(2, "0")}`);
  const buffer = await workbookToBuffer(wb);

  try {
    await createAuditLog({
      entityType: "export",
      entityId: `${year}-${month}`,
      action: "download",
      changes: { type: "monthly", year, month, filename },
    });
  } catch (e) {
    console.error("Audit log failed (monthly export):", e);
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}

// ── 연간 Export ───────────────────────────────────────────────

async function handleYearlyExport(options: { year: number }) {
  const year = Number(options.year);
  if (!Number.isFinite(year)) {
    return NextResponse.json(
      { error: "VALIDATION", message: "year must be a valid number" },
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

  // Sheet 1: 사업관리
  buildBusinessSheet(wb.addWorksheet("사업관리"), companies);

  // Sheet 2: 주간회의 — all weeks in the year (12 months)
  const allWeeks: { year: number; weekNumber: number; label: string }[] = [];
  for (let m = 1; m <= 12; m++) {
    const weeks = getWeeksInMonth(year, m);
    for (const w of weeks) {
      const key = `${w.year}-${w.weekNumber}`;
      if (!allWeeks.some((aw) => `${aw.year}-${aw.weekNumber}` === key)) {
        allWeeks.push({ year: w.year, weekNumber: w.weekNumber, label: `${m}월 ${w.weekInMonth}주` });
      }
    }
  }

  const weekLabels = allWeeks.map((w) => w.label);

  const cycles = await prisma.weeklyCycle.findMany({
    where: {
      OR: allWeeks.map((w) => ({ year: w.year, weekNumber: w.weekNumber })),
    },
  });

  const cycleMap = new Map(cycles.map((c) => [`${c.year}-${c.weekNumber}`, c.id]));
  const cycleIds = allWeeks.map((w) => cycleMap.get(`${w.year}-${w.weekNumber}`) ?? "");
  const validCycleIds = cycleIds.filter(Boolean);

  const actions = validCycleIds.length > 0
    ? await prisma.weeklyAction.findMany({
        where: { cycleId: { in: validCycleIds }, isArchived: false },
        orderBy: [{ companyId: "asc" }, { sortOrder: "asc" }],
      })
    : [];

  const actionsByCycleCompany = new Map<string, string[]>();
  for (const a of actions) {
    const key = `${a.cycleId}_${a.companyId}`;
    if (!actionsByCycleCompany.has(key)) actionsByCycleCompany.set(key, []);
    actionsByCycleCompany.get(key)!.push(stripHtml(a.content));
  }

  const companiesForWeekly = companies.map((c) => ({ id: c.id, canonicalName: c.canonicalName }));
  let maxActions = 4;
  for (const company of companiesForWeekly) {
    for (const cid of validCycleIds) {
      const key = `${cid}_${company.id}`;
      const count = actionsByCycleCompany.get(key)?.length ?? 0;
      if (count > maxActions) maxActions = count;
    }
  }

  buildWeeklySheet(
    wb.addWorksheet("주간회의"),
    companiesForWeekly,
    weekLabels,
    cycleIds,
    actionsByCycleCompany,
    maxActions,
  );

  const filename = generateFilename(`사업관리_${year}년`);
  const buffer = await workbookToBuffer(wb);

  try {
    await createAuditLog({
      entityType: "export",
      entityId: String(year),
      action: "download",
      changes: { type: "yearly", year, filename },
    });
  } catch (e) {
    console.error("Audit log failed (yearly export):", e);
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────

type CompanyWithBiz = Awaited<ReturnType<typeof prisma.company.findMany<{
  include: { businesses: { include: { progressItems: true } } };
}>>>[number];

function applyDataBorder(row: ExcelJS.Row) {
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    if (colNum <= 12) {
      cell.border = THIN_BORDER;
      cell.alignment = { ...cell.alignment, vertical: "top" };
    }
  });
}
