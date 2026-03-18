"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { MiniBlock } from "./mini-block";
import { useMoveProgressItem, useCreateProgressItem } from "@/hooks/use-progress-items";
import type { ProgressItem, Stage } from "@/types";

const STAGES: Stage[] = [
  "inbound",
  "funnel",
  "pipeline",
  "proposal",
  "contract",
  "build",
  "maintenance",
];

// Sortable block inside a stage
function SortableBlock({
  item,
  onClick,
}: {
  item: ProgressItem;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, data: { stage: item.stage } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MiniBlock
        id={item.id}
        title={item.title}
        content={item.content}
        stage={item.stage}
        date={item.date}
        createdAt={item.createdAt}
        onClick={onClick}
      />
    </div>
  );
}

// Droppable stage column
function DroppableStage({
  stage,
  items,
  businessId,
  onBlockClick,
}: {
  stage: Stage;
  items: ProgressItem[];
  businessId: string;
  onBlockClick?: (item: ProgressItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage}`, data: { stage } });
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const createItem = useCreateProgressItem();

  const handleAdd = () => {
    if (!newContent.trim()) return;
    createItem.mutate(
      { businessId, stage, content: newContent.trim() },
      { onSuccess: () => { setNewContent(""); setShowAdd(false); } },
    );
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[300px] w-[300px] shrink-0 flex-col gap-1.5 border-r border-[var(--border)] p-3 transition-colors ${
        isOver ? "bg-[var(--primary)]/10" : ""
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableBlock key={item.id} item={item} onClick={() => onBlockClick?.(item)} />
        ))}
      </SortableContext>

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
          <button onClick={handleAdd} className="shrink-0 text-xs text-[var(--primary)]">✓</button>
          <button onClick={() => setShowAdd(false)} className="shrink-0 text-xs text-[var(--muted-foreground)]">✕</button>
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

// Main component: wraps all stage columns in one DndContext for cross-stage drag
interface StageRowDndProps {
  businessId: string;
  progressItems: ProgressItem[];
  onBlockClick?: (item: ProgressItem) => void;
}

export function StageRowDnd({ businessId, progressItems, onBlockClick }: StageRowDndProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const moveItem = useMoveProgressItem();
  const [activeItem, setActiveItem] = useState<ProgressItem | null>(null);

  const itemsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage] = progressItems.filter((p) => p.stage === stage);
      return acc;
    },
    {} as Record<Stage, ProgressItem[]>,
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = progressItems.find((p) => p.id === event.active.id);
    setActiveItem(item ?? null);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback handled by isOver in DroppableStage
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeItemData = progressItems.find((p) => p.id === active.id);
    if (!activeItemData) return;

    // Determine target stage
    let targetStage: Stage | null = null;

    // Dropped on a stage droppable
    if (String(over.id).startsWith("stage-")) {
      targetStage = String(over.id).replace("stage-", "") as Stage;
    }
    // Dropped on another block — find that block's stage
    else {
      const overItem = progressItems.find((p) => p.id === over.id);
      if (overItem) {
        targetStage = overItem.stage;
      }
    }

    if (!targetStage) return;

    // If same stage and same position, skip
    if (targetStage === activeItemData.stage && active.id === over.id) return;

    // Calculate sort order
    const targetItems = itemsByStage[targetStage].filter((i) => i.id !== activeItemData.id);
    const overIndex = over.id === `stage-${targetStage}`
      ? targetItems.length
      : targetItems.findIndex((i) => i.id === over.id);
    const sortOrder = overIndex >= 0 ? overIndex : targetItems.length;

    moveItem.mutate({
      id: activeItemData.id,
      targetStage,
      sortOrder,
      lockVersion: activeItemData.lockVersion,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex">
        {STAGES.map((stage) => (
          <DroppableStage
            key={stage}
            stage={stage}
            items={itemsByStage[stage]}
            businessId={businessId}
            onBlockClick={onBlockClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem && (
          <div className="opacity-80 rotate-2 scale-105">
            <MiniBlock
              id={activeItem.id}
              title={activeItem.title}
              content={activeItem.content}
              stage={activeItem.stage}
              date={activeItem.date}
              createdAt={activeItem.createdAt}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
