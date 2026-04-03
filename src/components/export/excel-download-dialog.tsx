"use client";

import { useState } from "react";

interface ExcelDownloadDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExcelDownloadDialog({
  open,
  onClose,
}: ExcelDownloadDialogProps) {
  const [type, setType] = useState<"monthly" | "yearly">("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [downloading, setDownloading] = useState(false);

  if (!open) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const body: Record<string, unknown> = { type, year };
      if (type === "monthly") body.month = month;

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\s]+)/);
      const filename = match ? decodeURIComponent(match[1]) : "export.xlsx";

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
            <option value="monthly">월간</option>
            <option value="yearly">연간</option>
          </select>
        </label>

        <label className="mt-4 block text-sm font-medium">
          연도
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </label>

        {type === "monthly" && (
          <label className="mt-4 block text-sm font-medium">
            월
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}월
                </option>
              ))}
            </select>
          </label>
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
