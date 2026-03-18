"use client";

interface QuickActionButtonProps {
  label: string;
  onClick: () => void;
}

export function QuickActionButton({ label, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--accent)] transition-colors"
    >
      + {label}
    </button>
  );
}

interface QuickActionsBarProps {
  actions: { label: string; onClick: () => void }[];
}

export function QuickActionsBar({ actions }: QuickActionsBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <QuickActionButton
          key={action.label}
          label={action.label}
          onClick={action.onClick}
        />
      ))}
    </div>
  );
}
