"use client";

import { useState } from "react";
import { MiniBlock } from "./mini-block";
import { useCreateProgressItem } from "@/hooks/use-progress-items";
import type { ProgressItem, Stage } from "@/types";

interface StageCellProps {
  businessId: string;
  stage: Stage;
  items: ProgressItem[];
  onBlockClick?: (item: ProgressItem) => void;
}

export function StageCell({
  businessId,
  stage,
  items,
  onBlockClick,
}: StageCellProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const createItem = useCreateProgressItem();

  const visibleItems = items.slice(0, 3);
  const overflowCount = items.length - 3;

  const handleAdd = () => {
    if (!newContent.trim()) return;
    createItem.mutate(
      { businessId, stage, content: newContent.trim() },
      {
        onSuccess: () => {
          setNewContent("");
          setShowAdd(false);
        },
      },
    );
  };

  return (
    <div
      className="flex min-w-[120px] flex-1 flex-col gap-1 border-r border-[var(--border)] p-2"
      onClick={(e) => e.stopPropagation()}
    >
      {visibleItems.map((item) => (
        <MiniBlock
          key={item.id}
          id={item.id}
          content={item.content}
          stage={item.stage}
          createdAt={item.createdAt}
          onClick={() => onBlockClick?.(item)}
        />
      ))}

      {overflowCount > 0 && (
        <span className="text-[10px] text-[var(--muted-foreground)]">
          +{overflowCount} 더보기
        </span>
      )}

      {showAdd ? (
        <div className="flex gap-1">
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-[var(--ring)]"
            placeholder="내용..."
            autoFocus
          />
          <button
            onClick={handleAdd}
            className="shrink-0 text-xs text-[var(--primary)]"
          >
            ✓
          </button>
          <button
            onClick={() => setShowAdd(false)}
            className="shrink-0 text-xs text-[var(--muted-foreground)]"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
        >
          + 추가
        </button>
      )}
    </div>
  );
}
