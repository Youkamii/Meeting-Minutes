"use client";

import { useState } from "react";
import { StageRowDnd } from "@/components/progress-blocks/stage-row-dnd";
import { BlockDetail } from "@/components/progress-blocks/block-detail";
import type { Stage, ProgressItem } from "@/types";

interface BusinessRowProps {
  business: {
    id: string;
    name: string;
    embargoName?: string | null;
    visibility: string;
    scale: string | null;
    timingText: string | null;
    currentStage: Stage | null;
    assignedTo: string | null;
    companyName?: string;
    progressItems?: ProgressItem[];
  };
  onClick: () => void;
  visibleStages?: Set<string>;
}

export function BusinessRow({ business, onClick, visibleStages }: BusinessRowProps) {
  const [selectedBlock, setSelectedBlock] = useState<ProgressItem | null>(null);

  const displayName =
    business.visibility === "private" && business.embargoName
      ? business.embargoName
      : business.name;

  const nameColorClass =
    business.visibility === "private" && business.embargoName
      ? "text-red-900 dark:text-red-400"
      : "";

  return (
    <>
      <div className="flex items-stretch border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition-colors">
        {/* Fixed left column — 사업명 + 고객사명 + 규모 */}
        <div
          className="sticky left-0 z-[5] flex min-w-[280px] w-[280px] shrink-0 flex-col justify-center gap-1 border-r border-[var(--border)] bg-[var(--background)] px-4 py-3 cursor-pointer"
          onClick={onClick}
        >
          {/* 사업명 (크게) */}
          <span className={`text-base font-bold truncate ${nameColorClass}`}>
            {displayName}
          </span>
          {/* 고객사명 (작게) */}
          {business.companyName && (
            <span className="text-xs text-[var(--muted-foreground)] truncate">
              {business.companyName}
            </span>
          )}
          {/* 사업규모 */}
          {business.scale && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {business.scale}
              </span>
            </div>
          )}
        </div>

        {/* Stage columns with cross-stage drag & drop */}
        <StageRowDnd
          businessId={business.id}
          progressItems={(business.progressItems ?? []) as ProgressItem[]}
          onBlockClick={(item) => setSelectedBlock(item)}
          visibleStages={visibleStages}
        />
      </div>

      {selectedBlock && (
        <BlockDetail
          item={selectedBlock}
          open={!!selectedBlock}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </>
  );
}
