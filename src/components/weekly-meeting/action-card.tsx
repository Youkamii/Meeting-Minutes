"use client";

import { StatusDropdown } from "./status-dropdown";
import { useUpdateWeeklyAction } from "@/hooks/use-weekly-actions";
import { useCanEdit } from "@/lib/use-can-edit";
import type { ActionStatus, Priority, WeeklyActionWithRelations } from "@/types";

const PRIORITY_INDICATOR: Record<Priority, string> = {
  high: "border-l-red-500",
  medium: "border-l-yellow-500",
  low: "border-l-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "예정",
  in_progress: "진행중",
  completed: "완료",
  on_hold: "보류",
};

interface ActionCardProps {
  action: WeeklyActionWithRelations;
}

export function ActionCard({ action }: ActionCardProps) {
  const updateAction = useUpdateWeeklyAction();
  const canEdit = useCanEdit();

  const handleStatusChange = (status: ActionStatus) => {
    if (!canEdit) return;
    updateAction.mutate({
      id: action.id,
      status,
      lockVersion: action.lockVersion,
    });
  };

  return (
    <div
      className={`rounded-md border border-[var(--border)] border-l-2 ${PRIORITY_INDICATOR[action.priority]} bg-[var(--card)] p-3 hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm">{action.content}</p>
          {action.business && (
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              → {action.business.name}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {action.carryoverCount > 0 && (
            <span
              className="rounded bg-[var(--priority-medium)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--priority-medium)]"
              title={`${action.carryoverCount}회 이월됨`}
            >
              ↻ {action.carryoverCount}
            </span>
          )}
          {canEdit ? (
            <StatusDropdown
              value={action.status}
              onChange={handleStatusChange}
            />
          ) : (
            <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
              {STATUS_LABELS[action.status] ?? action.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
