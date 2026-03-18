"use client";

import { useMoveProgressItem } from "@/hooks/use-progress-items";
import type { ProgressItem, Stage } from "@/types";

const STAGES: { value: Stage; label: string }[] = [
  { value: "inbound", label: "Inbound" },
  { value: "funnel", label: "Funnel" },
  { value: "pipeline", label: "Pipeline" },
  { value: "proposal", label: "제안" },
  { value: "contract", label: "계약" },
  { value: "build", label: "구축" },
  { value: "maintenance", label: "유지보수" },
];

interface MobileStageMenuProps {
  item: ProgressItem;
  open: boolean;
  onClose: () => void;
}

export function MobileStageMenu({
  item,
  open,
  onClose,
}: MobileStageMenuProps) {
  const moveItem = useMoveProgressItem();

  if (!open) return null;

  const handleMove = (targetStage: Stage) => {
    if (targetStage === item.stage) {
      onClose();
      return;
    }
    moveItem.mutate(
      { id: item.id, targetStage, lockVersion: item.lockVersion },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:hidden"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full rounded-t-xl border-t border-[var(--border)] bg-[var(--background)] p-4 pb-8">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--muted-foreground)]" />
        <h3 className="text-sm font-bold mb-3">단계 이동</h3>
        <div className="space-y-1">
          {STAGES.map((stage) => (
            <button
              key={stage.value}
              onClick={() => handleMove(stage.value)}
              className={`w-full rounded-md px-4 py-3 text-left text-sm transition-colors ${
                stage.value === item.stage
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "hover:bg-[var(--muted)]"
              }`}
            >
              {stage.label}
              {stage.value === item.stage && " (현재)"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
