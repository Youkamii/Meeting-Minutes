"use client";

import type { ActionStatus } from "@/types";

const STATUS_OPTIONS: { value: ActionStatus; label: string; color: string }[] = [
  { value: "scheduled", label: "예정", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "in_progress", label: "진행중", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "completed", label: "완료", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  { value: "on_hold", label: "보류", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
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
