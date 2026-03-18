"use client";

import { StatusBadge } from "@/components/weekly-meeting/status-dropdown";
import type { ActionStatus } from "@/types";

interface IncompleteAction {
  id: string;
  content: string;
  status: ActionStatus;
  carryoverCount: number;
  company?: { canonicalName: string };
}

interface IncompleteActionsCardProps {
  actions: IncompleteAction[];
}

export function IncompleteActionsCard({ actions }: IncompleteActionsCardProps) {
  const incomplete = actions.filter(
    (a) => a.status === "scheduled" || a.status === "in_progress",
  );

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">이번 주 액션</h2>
        <span className="text-xs text-[var(--muted-foreground)]">
          {incomplete.length}개 미완료
        </span>
      </div>

      {incomplete.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          모두 완료되었습니다!
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {incomplete.slice(0, 10).map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-md bg-[var(--muted)] px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{a.content}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {a.company?.canonicalName}
                </p>
              </div>
              <StatusBadge status={a.status} />
              {a.carryoverCount > 0 && (
                <span className="text-[10px] text-orange-600 dark:text-orange-400">
                  ↻{a.carryoverCount}
                </span>
              )}
            </div>
          ))}
          {incomplete.length > 10 && (
            <p className="text-xs text-[var(--muted-foreground)] text-center">
              +{incomplete.length - 10} 더보기
            </p>
          )}
        </div>
      )}
    </div>
  );
}
