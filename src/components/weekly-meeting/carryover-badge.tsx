"use client";

interface CarryoverBadgeProps {
  count: number;
}

export function CarryoverBadge({ count }: CarryoverBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-0.5 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      title={`${count}회 이월됨`}
    >
      ↻ {count}
    </span>
  );
}
