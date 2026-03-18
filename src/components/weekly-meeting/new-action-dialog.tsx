"use client";

import { useState } from "react";
import { useCreateWeeklyAction } from "@/hooks/use-weekly-actions";
import type { Company } from "@/types";

interface NewActionDialogProps {
  open: boolean;
  onClose: () => void;
  cycleId: string;
  companies: Company[];
  preselectedCompanyId?: string;
}

export function NewActionDialog({
  open,
  onClose,
  cycleId,
  companies,
  preselectedCompanyId,
}: NewActionDialogProps) {
  const [companyId, setCompanyId] = useState(preselectedCompanyId ?? "");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const createAction = useCreateWeeklyAction();

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !content.trim()) return;
    createAction.mutate(
      { cycleId, companyId, content: content.trim(), priority },
      {
        onSuccess: () => {
          setContent("");
          onClose();
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="mx-4 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold">New Weekly Action</h2>

        <label className="mt-4 block text-sm font-medium">
          Company *
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            required
          >
            <option value="">Select company...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.canonicalName}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm font-medium">
          Action / Issue *
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            rows={3}
            required
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "high" | "medium" | "low")}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createAction.isPending || !companyId || !content.trim()}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {createAction.isPending ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
