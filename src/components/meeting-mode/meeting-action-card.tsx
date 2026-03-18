"use client";

import { useUpdateWeeklyAction } from "@/hooks/use-weekly-actions";
import type { ActionStatus, Priority, WeeklyActionWithRelations } from "@/types";

const STATUS_OPTIONS: { value: ActionStatus; label: string; color: string }[] = [
  { value: "scheduled", label: "예정", color: "bg-blue-500" },
  { value: "in_progress", label: "진행중", color: "bg-yellow-500" },
  { value: "completed", label: "완료", color: "bg-green-500" },
  { value: "on_hold", label: "보류", color: "bg-gray-500" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "high", label: "높음" },
  { value: "medium", label: "보통" },
  { value: "low", label: "낮음" },
];

interface MeetingActionCardProps {
  action: WeeklyActionWithRelations;
}

export function MeetingActionCard({ action }: MeetingActionCardProps) {
  const updateAction = useUpdateWeeklyAction();

  const handleStatusChange = (status: ActionStatus) => {
    updateAction.mutate({ id: action.id, status, lockVersion: action.lockVersion });
  };

  const handlePriorityChange = (priority: Priority) => {
    updateAction.mutate({ id: action.id, priority, lockVersion: action.lockVersion });
  };

  const currentStatus = STATUS_OPTIONS.find((o) => o.value === action.status)!;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="text-lg leading-relaxed">{action.content}</p>

      {action.business && (
        <p className="mt-1 text-base text-[var(--muted-foreground)]">
          → {action.business.name}
        </p>
      )}

      {action.carryoverCount > 0 && (
        <span className="mt-2 inline-block rounded bg-orange-100 px-2 py-1 text-sm font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          ↻ {action.carryoverCount}회 이월
        </span>
      )}

      {/* Large tap targets for status */}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleStatusChange(opt.value)}
            className={`rounded-lg px-4 py-2 text-base font-medium transition-all ${
              action.status === opt.value
                ? `${opt.color} text-white shadow-md scale-105`
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Priority selector */}
      <div className="mt-3 flex gap-2">
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePriorityChange(opt.value)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              action.priority === opt.value
                ? "bg-[var(--foreground)] text-[var(--background)] font-medium"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
