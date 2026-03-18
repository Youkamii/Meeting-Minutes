"use client";

interface WeekEndActionsProps {
  onCarryover: () => void;
}

export function WeekEndActions({ onCarryover }: WeekEndActionsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onCarryover}
        className="rounded-md border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-950/50 transition-colors"
      >
        ↻ 이월
      </button>
    </div>
  );
}
