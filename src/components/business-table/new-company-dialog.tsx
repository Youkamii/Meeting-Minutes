"use client";

import { useState } from "react";
import { useCreateCompany } from "@/hooks/use-companies";

interface NewCompanyDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewCompanyDialog({ open, onClose }: NewCompanyDialogProps) {
  const [name, setName] = useState("");
  const createCompany = useCreateCompany();

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCompany.mutate(
      { canonicalName: name.trim() },
      {
        onSuccess: () => {
          setName("");
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
        <h2 className="text-lg font-bold">새 기업</h2>

        <label className="mt-4 block text-sm font-medium">
          대표 이름 *
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            autoFocus
            required
          />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createCompany.isPending || !name.trim()}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {createCompany.isPending ? "생성 중..." : "생성"}
          </button>
        </div>
      </form>
    </div>
  );
}
