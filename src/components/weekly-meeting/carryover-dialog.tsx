"use client";

import { useState } from "react";
import { useCarryoverCandidates, useCarryover } from "@/hooks/use-weekly-actions";
import { StatusBadge } from "./status-dropdown";
import { CarryoverBadge } from "./carryover-badge";
import type { ActionStatus, Priority } from "@/types";

interface CarryoverDialogProps {
  open: boolean;
  onClose: () => void;
  sourceCycleId: string;
  targetCycleId: string;
  sourceLabel: string;
  targetLabel: string;
}

export function CarryoverDialog({
  open,
  onClose,
  sourceCycleId,
  targetCycleId,
  sourceLabel,
  targetLabel,
}: CarryoverDialogProps) {
  const { data, isLoading } = useCarryoverCandidates(open ? sourceCycleId : null);
  const carryover = useCarryover();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!open) return null;

  const candidates = (data?.data ?? []) as Array<{
    id: string;
    content: string;
    status: ActionStatus;
    priority: Priority;
    carryoverCount: number;
    company?: { canonicalName: string };
  }>;

  const toggleAll = () => {
    if (selected.size === candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(candidates.map((c) => c.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleCarryover = () => {
    if (selected.size === 0) return;
    carryover.mutate(
      {
        sourceCycleId,
        targetCycleId,
        actionIds: [...selected],
      },
      {
        onSuccess: () => {
          setSelected(new Set());
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
      <div className="mx-4 w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
        <h2 className="text-lg font-bold">Carryover Actions</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {sourceLabel} → {targetLabel}
        </p>

        {isLoading && (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Loading candidates...
          </p>
        )}

        {!isLoading && candidates.length === 0 && (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            No incomplete actions to carry over.
          </p>
        )}

        {candidates.length > 0 && (
          <>
            <div className="mt-4 flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === candidates.length}
                  onChange={toggleAll}
                  className="rounded"
                />
                Select all ({candidates.length})
              </label>
            </div>

            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {candidates.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-[var(--border)] p-2 hover:bg-[var(--muted)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="mt-0.5 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{c.content}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {c.company?.canonicalName}
                      </span>
                      <StatusBadge status={c.status} />
                      <CarryoverBadge count={c.carryoverCount} />
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)]"
          >
            Cancel
          </button>
          <button
            onClick={handleCarryover}
            disabled={carryover.isPending || selected.size === 0}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {carryover.isPending
              ? "Carrying over..."
              : `Carry Over (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
