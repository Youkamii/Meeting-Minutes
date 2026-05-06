import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-6" : "py-12"
      }`}
    >
      {icon && (
        <div className="mb-3 text-2xl text-[var(--muted-foreground)] opacity-60">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
