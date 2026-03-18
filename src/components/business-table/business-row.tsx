"use client";

import { useState } from "react";
import { StageRowDnd } from "@/components/progress-blocks/stage-row-dnd";
import { BlockDetail } from "@/components/progress-blocks/block-detail";
import type { Stage, ProgressItem } from "@/types";

interface BusinessRowProps {
  business: {
    id: string;
    name: string;
    visibility: string;
    scale: string | null;
    timingText: string | null;
    currentStage: Stage | null;
    assignedToId: string | null;
    progressItems?: {
      id: string;
      businessId: string;
      stage: Stage;
      content: string;
      sortOrder: number;
      createdBy: string | null;
      updatedBy: string | null;
      createdAt: string;
      updatedAt: string;
      lockVersion: number;
    }[];
  };
  onClick: () => void;
}

export function BusinessRow({ business, onClick }: BusinessRowProps) {
  const [selectedBlock, setSelectedBlock] = useState<ProgressItem | null>(null);

  return (
    <>
      <div className="flex items-stretch border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition-colors">
        {/* Fixed left columns — clickable for detail */}
        <div
          className="flex min-w-[400px] shrink-0 items-center gap-3 border-r border-[var(--border)] px-4 py-2 cursor-pointer"
          onClick={onClick}
        >
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

        {/* Stage columns with cross-stage drag & drop */}
        <StageRowDnd
          businessId={business.id}
          progressItems={(business.progressItems ?? []) as ProgressItem[]}
          onBlockClick={(item) => setSelectedBlock(item)}
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
