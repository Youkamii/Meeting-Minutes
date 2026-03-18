"use client";

import { useState } from "react";

interface ExcelDownloadDialogProps {
  open: boolean;
  onClose: () => void;
  defaultType?: "weekly" | "monthly" | "current_view";
  cycleId?: string;
}

export function ExcelDownloadDialog({
  open,
  onClose,
  defaultType = "weekly",
  cycleId,
}: ExcelDownloadDialogProps) {
  const [type, setType] = useState(defaultType);
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [includeCarryover, setIncludeCarryover] = useState(true);
  const [downloading, setDownloading] = useState(false);

  if (!open) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const body: Record<string, unknown> = { type };

      if (type === "weekly" && cycleId) {
        body.cycleId = cycleId;
        body.includeCompleted = includeCompleted;
        body.includeCarryover = includeCarryover;
      } else if (type === "monthly") {
        body.year = new Date().getFullYear();
        body.month = new Date().getMonth() + 1;
      } else if (type === "current_view") {
        body.view = "business_management";
      }

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const filename =
        res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ??
        "export.xlsx";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      alert("다운로드에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-4 w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
        <h2 className="text-lg font-bold">엑셀 다운로드</h2>

        <label className="mt-4 block text-sm font-medium">
          유형
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="current_view">현재 보기</option>
            <option value="weekly">주간</option>
            <option value="monthly">월간</option>
          </select>
        </label>

        {type === "weekly" && (
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={includeCompleted}
                onChange={(e) => setIncludeCompleted(e.target.checked)}
                className="rounded"
              />
              완료 항목 포함
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={includeCarryover}
                onChange={(e) => setIncludeCarryover(e.target.checked)}
                className="rounded"
              />
              이월 항목 포함
            </label>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)]"
          >
            취소
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {downloading ? "다운로드 중..." : "다운로드"}
          </button>
        </div>
      </div>
    </div>
  );
}
