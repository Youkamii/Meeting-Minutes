"use client";

import type { Stage } from "@/types";

const STAGES: Stage[] = [
  "inbound",
  "funnel",
  "pipeline",
  "proposal",
  "contract",
  "build",
  "maintenance",
];

const STAGE_LABELS: Record<Stage, string> = {
  inbound: "Inbound",
  funnel: "Funnel",
  pipeline: "Pipeline",
  proposal: "제안",
  contract: "계약",
  build: "구축",
  maintenance: "유지보수",
};

interface BusinessRowProps {
  business: {
    id: string;
    name: string;
    visibility: string;
    scale: string | null;
    timingText: string | null;
    currentStage: Stage | null;
    assignedToId: string | null;
    progressItems?: { id: string; stage: Stage; content: string }[];
  };
  onClick: () => void;
}

export function BusinessRow({ business, onClick }: BusinessRowProps) {
  const progressByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage] = (business.progressItems ?? []).filter(
        (p) => p.stage === stage,
      );
      return acc;
    },
    {} as Record<Stage, { id: string; content: string }[]>,
  );

  return (
    <div
      className="flex cursor-pointer items-stretch border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition-colors"
      onClick={onClick}
    >
      {/* Fixed left columns */}
      <div className="flex min-w-[400px] shrink-0 items-center gap-3 border-r border-[var(--border)] px-4 py-2">
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            business.visibility === "public"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {business.visibility === "public" ? "공개" : "비공개"}
        </span>

        <span className="text-sm font-medium truncate flex-1">
          {business.name}
        </span>

        <span className="text-xs text-[var(--muted-foreground)] truncate max-w-[80px]">
          {business.timingText ?? "—"}
        </span>

        <span className="text-xs text-[var(--muted-foreground)] truncate max-w-[60px]">
          {business.scale ?? "—"}
        </span>
      </div>

      {/* Scrollable stage columns */}
      <div className="flex flex-1 overflow-x-auto">
        {STAGES.map((stage) => {
          const items = progressByStage[stage];
          return (
            <div
              key={stage}
              className="flex min-w-[120px] flex-1 flex-col gap-1 border-r border-[var(--border)] p-2"
            >
              <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase">
                {STAGE_LABELS[stage]}
              </span>

              {items.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="rounded bg-[var(--muted)] px-2 py-1 text-xs truncate"
                  title={item.content}
                >
                  {item.content}
                </div>
              ))}

              {items.length > 2 && (
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  +{items.length - 2} 더보기
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
