"use client";

import type { ActionStatus } from "@/types";

const STATUS_OPTIONS: { value: ActionStatus; label: string; color: string }[] = [
  { value: "scheduled", label: "예정", color: "bg-[var(--status-scheduled)]/15 text-[var(--status-scheduled)]" },
  { value: "in_progress", label: "진행중", color: "bg-[var(--status-in-progress)]/15 text-[var(--status-in-progress)]" },
  { value: "completed", label: "완료", color: "bg-[var(--status-completed)]/15 text-[var(--status-completed)]" },
  { value: "on_hold", label: "보류", color: "bg-[var(--status-on-hold)]/15 text-[var(--status-on-hold)]" },
];

interface StatusDropdownProps {
  value: ActionStatus;
  onChange: (status: ActionStatus) => void;
}

export function StatusDropdown({ value, onChange }: StatusDropdownProps) {
  const current = STATUS_OPTIONS.find((o) => o.value === value)!;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ActionStatus)}
      onClick={(e) => e.stopPropagation()}
      className={`cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium border-0 outline-none ${current.color}`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function StatusBadge({ status }: { status: ActionStatus }) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status)!;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${opt.color}`}>
      {opt.label}
    </span>
  );
}
