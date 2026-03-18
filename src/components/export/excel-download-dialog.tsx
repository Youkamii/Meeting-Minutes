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
      alert("Download failed. Please try again.");
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
        <h2 className="text-lg font-bold">Excel Download</h2>

        <label className="mt-4 block text-sm font-medium">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="current_view">Current View</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
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
              Include completed
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={includeCarryover}
                onChange={(e) => setIncludeCarryover(e.target.checked)}
                className="rounded"
              />
              Include carryover
            </label>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)]"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
