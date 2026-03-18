"use client";

import { useState } from "react";
import { useCreateBusiness } from "@/hooks/use-businesses";
import type { Company } from "@/types";

interface NewBusinessDialogProps {
  open: boolean;
  onClose: () => void;
  companies: Company[];
  preselectedCompanyId?: string;
}

export function NewBusinessDialog({
  open,
  onClose,
  companies,
  preselectedCompanyId,
}: NewBusinessDialogProps) {
  const [companyId, setCompanyId] = useState(preselectedCompanyId ?? "");
  const [name, setName] = useState("");
  const [scale, setScale] = useState("");
  const [timingText, setTimingText] = useState("");
  const [timingStart, setTimingStart] = useState("");
  const [timingEnd, setTimingEnd] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const createBusiness = useCreateBusiness();

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !name.trim()) return;
    createBusiness.mutate(
      {
        companyId,
        name: name.trim(),
        visibility,
        scale: scale || undefined,
        timingText: timingText || undefined,
        timingStart: timingStart || undefined,
        timingEnd: timingEnd || undefined,
      },
      {
        onSuccess: () => {
          setName("");
          setScale("");
          setTimingText("");
          setTimingStart("");
          setTimingEnd("");
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
        className="mx-4 w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold">새 사업</h2>

        <label className="mt-4 block text-sm font-medium">
          기업 *
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            required
          >
            <option value="">기업 선택...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.canonicalName}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm font-medium">
          사업명 *
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            required
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium">
            사업규모
            <input
              type="text"
              value={scale}
              onChange={(e) => setScale(e.target.value)}
              placeholder="e.g. 5억 규모"
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
          <label className="block text-sm font-medium">
            공개여부
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "public" | "private")
              }
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="public">공개</option>
              <option value="private">비공개</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium">
          사업시기 (텍스트)
          <input
            type="text"
            value={timingText}
            onChange={(e) => setTimingText(e.target.value)}
            placeholder="e.g. 2026 상반기"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium">
            시작일
            <input
              type="date"
              value={timingStart}
              onChange={(e) => setTimingStart(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
          <label className="block text-sm font-medium">
            종료일
            <input
              type="date"
              value={timingEnd}
              onChange={(e) => setTimingEnd(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
        </div>

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
            disabled={createBusiness.isPending || !companyId || !name.trim()}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {createBusiness.isPending ? "생성 중..." : "생성"}
          </button>
        </div>
      </form>
    </div>
  );
}
