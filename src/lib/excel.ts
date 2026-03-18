import ExcelJS from "exceljs";

export function createWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Meeting Minutes";
  wb.created = new Date();
  return wb;
}

export function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8E8E8" },
    };
    cell.border = {
      bottom: { style: "thin" },
    };
  });
}

export function generateFilename(prefix: string): string {
  const now = new Date();
  const ts = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  return `${prefix}_${ts}.xlsx`;
}

export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Uint8Array> {
  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
