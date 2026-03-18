"use client";

import { useCallback } from "react";

interface ConflictDialogProps {
  open: boolean;
  onClose: () => void;
  onReapply: () => void;
  onUseLatest: () => void;
  latest: Record<string, unknown>;
  submitted: Record<string, unknown>;
}

function DiffRow({
  field,
  serverValue,
  clientValue,
}: {
  field: string;
  serverValue: unknown;
  clientValue: unknown;
}) {
  const isDifferent =
    JSON.stringify(serverValue) !== JSON.stringify(clientValue);

  if (!isDifferent) return null;

  return (
    <tr className="border-b border-[var(--border)]">
      <td className="px-3 py-2 text-sm font-medium">{field}</td>
      <td className="px-3 py-2 text-sm bg-red-50 dark:bg-red-950/20">
        {String(serverValue ?? "—")}
      </td>
      <td className="px-3 py-2 text-sm bg-green-50 dark:bg-green-950/20">
        {String(clientValue ?? "—")}
      </td>
    </tr>
  );
}

export function ConflictDialog({
  open,
  onClose,
  onReapply,
  onUseLatest,
  latest,
  submitted,
}: ConflictDialogProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  const allFields = new Set([
    ...Object.keys(latest),
    ...Object.keys(submitted),
  ]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="mx-4 w-full max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
        <h2 className="text-lg font-bold">Conflict Detected</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          This record was modified by another user. Compare the changes below.
        </p>

        <div className="mt-4 max-h-80 overflow-auto rounded border border-[var(--border)]">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[var(--muted)]">
              <tr>
                <th className="px-3 py-2 text-xs font-medium">Field</th>
                <th className="px-3 py-2 text-xs font-medium">
                  Server (Latest)
                </th>
                <th className="px-3 py-2 text-xs font-medium">Your Changes</th>
              </tr>
            </thead>
            <tbody>
              {[...allFields].map((field) => (
                <DiffRow
                  key={field}
                  field={field}
                  serverValue={latest[field]}
                  clientValue={submitted[field]}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onUseLatest}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Use Latest
          </button>
          <button
            onClick={onReapply}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Re-apply My Changes
          </button>
        </div>
      </div>
    </div>
  );
}
