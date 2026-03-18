"use client";

import { StatusDropdown } from "./status-dropdown";
import { useUpdateWeeklyAction } from "@/hooks/use-weekly-actions";
import type { ActionStatus, Priority, WeeklyActionWithRelations } from "@/types";

const PRIORITY_INDICATOR: Record<Priority, string> = {
  high: "border-l-red-500",
  medium: "border-l-yellow-500",
  low: "border-l-gray-400",
};

interface ActionCardProps {
  action: WeeklyActionWithRelations;
}

export function ActionCard({ action }: ActionCardProps) {
  const updateAction = useUpdateWeeklyAction();

  const handleStatusChange = (status: ActionStatus) => {
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
              className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              title={`${action.carryoverCount}회 이월됨`}
            >
              ↻ {action.carryoverCount}
            </span>
          )}
          <StatusDropdown
            value={action.status}
            onChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
}
