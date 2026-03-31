"use client";

import DOMPurify from "dompurify";
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div
        className="text-xl leading-relaxed break-words [&_p]:m-0 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:pl-5 [&_ol]:list-decimal"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(action.content) }}
      />

      {action.business && (
        <p className="mt-2 text-lg text-[var(--muted-foreground)]">
          → {action.business.name}
        </p>
      )}

      {/* Large tap targets for status */}
      <div className="mt-5 flex flex-wrap gap-3">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleStatusChange(opt.value)}
            className={`rounded-lg px-5 py-2.5 text-lg font-medium transition-all ${
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
      <div className="mt-4 flex gap-2">
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePriorityChange(opt.value)}
            className={`rounded-md px-4 py-1.5 text-base transition-colors ${
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
