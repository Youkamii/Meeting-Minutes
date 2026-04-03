"use client";

import { useState } from "react";
import { StageRowDnd } from "@/components/progress-blocks/stage-row-dnd";
import { BlockDetail } from "@/components/progress-blocks/block-detail";
import type { Stage, ProgressItem } from "@/types";

interface BusinessRowProps {
  business: {
    id: string;
    companyId?: string;
    name: string;
    embargoName?: string | null;
    visibility: string;
    scale: string | null;
    timingText: string | null;
    timingStart?: string | null;
    timingEnd?: string | null;
    funnelNumbers?: Record<string, string> | null;
    currentStage: Stage | null;
    assignedTo: string | null;
    isArchived?: boolean;
    companyName?: string;
    progressItems?: ProgressItem[];
    lockVersion?: number;
  };
  onClick: () => void;
  visibleStages?: Set<string>;
  highlighted?: boolean;
}

export function BusinessRow({ business, onClick, visibleStages, highlighted }: BusinessRowProps) {
  const [selectedBlock, setSelectedBlock] = useState<ProgressItem | null>(null);
  const [expanded, setExpanded] = useState(!business.isArchived);

  const displayName =
    business.visibility === "private" && business.embargoName
      ? business.embargoName
      : business.name;

  const nameColorClass =
    business.visibility === "private" && business.embargoName
      ? "text-red-900 dark:text-red-400"
      : "";

  const isArchived = business.isArchived ?? false;

  // Format date range
  const formatDate = (d: string | null | undefined) => {
    if (!d) return null;
    return String(d).slice(0, 10);
  };
  const startDate = formatDate(business.timingStart);
  const endDate = formatDate(business.timingEnd);
  const dateDisplay = startDate
    ? endDate
      ? `${startDate} ~ ${endDate}`
      : startDate
    : null;

  return (
    <>
      <div
        data-business-id={business.id}
        className={`flex items-stretch border-b hover:bg-[var(--accent)]/50 transition-all ${isArchived ? "opacity-60" : ""} ${highlighted ? "border-[3px] border-blue-500" : "border-[var(--border)]"}`}
      >
        {/* Fixed left column */}
        <div
          className="sticky left-0 z-[5] flex min-w-[280px] w-[280px] shrink-0 flex-col justify-center gap-0.5 border-r border-[var(--border)] bg-[#fafafa] dark:bg-[#191919] px-4 py-3 cursor-pointer"
          onClick={isArchived ? () => setExpanded(!expanded) : onClick}
          onDoubleClick={isArchived ? onClick : undefined}
        >
          {/* 사업명 */}
          <div className="flex items-center gap-1.5">
            {isArchived && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {expanded ? "▼" : "▶"}
              </span>
            )}
            <span className={`text-lg font-bold truncate ${nameColorClass} ${isArchived ? "line-through text-[var(--muted-foreground)]" : ""}`}>
              {displayName}
            </span>
            {isArchived && (
              <span className="text-[9px] bg-[var(--muted)] text-[var(--muted-foreground)] rounded px-1.5 py-0.5 shrink-0">
                종료
              </span>
            )}
          </div>
          {/* 시작~종료일 */}
          {dateDisplay && (
            <span className="text-xs text-[var(--muted-foreground)] truncate">
              {dateDisplay}
            </span>
          )}
          {/* 사업규모 */}
          {business.scale && (
            <span className="text-[10px] text-[var(--muted-foreground)]">
              {business.scale}
            </span>
          )}
        </div>

        {/* Stage columns — hidden when archived and collapsed */}
        {(!isArchived || expanded) && (
          <StageRowDnd
            businessId={business.id}
            progressItems={(business.progressItems ?? []) as ProgressItem[]}
            onBlockClick={(item) => setSelectedBlock(item)}
            visibleStages={visibleStages}
            funnelNumbers={business.funnelNumbers ?? undefined}
            lockVersion={business.lockVersion}
          />
        )}
      </div>

      {selectedBlock && (
        <BlockDetail
          item={selectedBlock}
          open={!!selectedBlock}
          onClose={() => setSelectedBlock(null)}
          companyId={business.companyId}
        />
      )}
    </>
  );
}
