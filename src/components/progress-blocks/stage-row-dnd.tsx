"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
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
import { useUpdateBusiness } from "@/hooks/use-businesses";
import { STAGES } from "@/lib/constants";
import type { ProgressItem, Stage } from "@/types";

// Sortable block inside a stage
function SortableBlock({
  item,
  onClick,
  hidden,
}: {
  item: ProgressItem;
  onClick?: () => void;
  hidden?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id, data: { stage: item.stage } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: hidden ? "none" : transition,
    opacity: hidden ? 0 : 1,
    height: hidden ? 0 : undefined,
    overflow: hidden ? "hidden" as const : undefined,
    margin: hidden ? 0 : undefined,
    padding: hidden ? 0 : undefined,
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
  funnelNo,
  onFunnelNoChange,
  draggingId,
}: {
  stage: Stage;
  items: ProgressItem[];
  businessId: string;
  onBlockClick?: (item: ProgressItem) => void;
  funnelNo?: string;
  onFunnelNoChange?: (stage: Stage, value: string) => void;
  draggingId?: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage}`, data: { stage } });
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const createItem = useCreateProgressItem();

  const [editingFunnel, setEditingFunnel] = useState(false);
  const [funnelValue, setFunnelValue] = useState(funnelNo ?? "");
  const funnelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingFunnel) setFunnelValue(funnelNo ?? "");
  }, [funnelNo, editingFunnel]);

  const handleFunnelSave = () => {
    setEditingFunnel(false);
    const trimmed = funnelValue.trim();
    if (trimmed !== (funnelNo ?? "")) {
      onFunnelNoChange?.(stage, trimmed);
    }
  };

  const handleFunnelCancel = () => {
    setEditingFunnel(false);
    setFunnelValue(funnelNo ?? "");
  };

  const addingRef = useRef(false);
  const handleAdd = () => {
    if (!newTitle.trim() || addingRef.current) return;
    addingRef.current = true;
    createItem.mutate(
      { businessId, stage, title: newTitle.trim() },
      { onSuccess: () => { setNewTitle(""); setShowAdd(false); addingRef.current = false; },
        onError: () => { addingRef.current = false; } },
    );
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[300px] w-[300px] shrink-0 flex-col gap-2.5 border-r border-[var(--border)] p-3 transition-colors ${
        isOver ? "bg-[var(--primary)]/10" : "bg-[var(--muted)]/30"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* FunnelNo. display */}
      <div className="min-h-[18px] -mb-1">
        {editingFunnel ? (
          <input
            ref={funnelInputRef}
            type="text"
            value={funnelValue}
            onChange={(e) => setFunnelValue(e.target.value)}
            onBlur={handleFunnelSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFunnelSave();
              if (e.key === "Escape") handleFunnelCancel();
            }}
            className="w-full border border-transparent bg-transparent px-0 py-0 text-xs font-bold font-mono text-[var(--primary)] outline-none focus:border-[var(--primary)]/30"
            autoFocus
          />
        ) : (
          <div
            className="group cursor-default"
            onDoubleClick={() => {
              setEditingFunnel(true);
              setTimeout(() => funnelInputRef.current?.focus(), 0);
            }}
          >
            {funnelNo ? (
              <span className="text-xs font-bold font-mono text-[var(--primary)]">{funnelNo}</span>
            ) : (
              <span className="text-xs font-bold font-mono text-transparent group-hover:text-[var(--muted-foreground)]/30 transition-colors select-none">
                No.
              </span>
            )}
          </div>
        )}
      </div>

      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableBlock key={item.id} item={item} onClick={() => onBlockClick?.(item)} hidden={item.id === draggingId} />
        ))}
      </SortableContext>

      {showAdd ? (
        <div className="flex gap-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") { setNewTitle(""); setShowAdd(false); }
            }}
            onBlur={() => { if (newTitle.trim()) handleAdd(); else setShowAdd(false); }}
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[var(--ring)]"
            placeholder="제목..."
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors mt-1 px-2 py-1 rounded hover:bg-[var(--muted)]"
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
  visibleStages?: Set<string>;
  funnelNumbers?: Record<string, string>;
  lockVersion?: number;
}

export function StageRowDnd({ businessId, progressItems, onBlockClick, visibleStages, funnelNumbers, lockVersion }: StageRowDndProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );
  const moveItem = useMoveProgressItem();
  const updateBusiness = useUpdateBusiness();
  const [activeItem, setActiveItem] = useState<ProgressItem | null>(null);
  const [localItems, setLocalItems] = useState<ProgressItem[]>(progressItems);
  const [hiddenId, setHiddenId] = useState<string | null>(null);

  // Sync from props when server data updates (and not mid-drag)
  useEffect(() => {
    if (!activeItem) {
      setLocalItems(progressItems);
    }
  }, [progressItems, activeItem]);

  // Clear hiddenId one frame after localItems updates
  useEffect(() => {
    if (hiddenId && !activeItem) {
      const raf = requestAnimationFrame(() => setHiddenId(null));
      return () => cancelAnimationFrame(raf);
    }
  }, [localItems, hiddenId, activeItem]);

  const handleFunnelNoChange = useCallback(
    (stage: Stage, value: string) => {
      const updated = { ...(funnelNumbers ?? {}) };
      if (value === "") {
        delete updated[stage];
      } else {
        updated[stage] = value;
      }
      updateBusiness.mutate({
        id: businessId,
        funnelNumbers: Object.keys(updated).length > 0 ? updated : null,
        lockVersion: lockVersion ?? 1,
      });
    },
    [businessId, funnelNumbers, lockVersion, updateBusiness],
  );

  const itemsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage] = localItems.filter((p) => p.stage === stage);
      return acc;
    },
    {} as Record<Stage, ProgressItem[]>,
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = localItems.find((p) => p.id === event.active.id);
    setActiveItem(item ?? null);
    setHiddenId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveItem(null);
      setHiddenId(null);
      return;
    }

    const activeItemData = localItems.find((p) => p.id === active.id);
    if (!activeItemData) {
      setActiveItem(null);
      setHiddenId(null);
      return;
    }

    // Determine target stage
    let targetStage: Stage | null = null;

    // Dropped on a stage droppable
    if (String(over.id).startsWith("stage-")) {
      targetStage = String(over.id).replace("stage-", "") as Stage;
    }
    // Dropped on another block — find that block's stage
    else {
      const overItem = localItems.find((p) => p.id === over.id);
      if (overItem) {
        targetStage = overItem.stage;
      }
    }

    if (!targetStage) {
      setActiveItem(null);
      setHiddenId(null);
      return;
    }

    // If same stage and same position, skip
    if (targetStage === activeItemData.stage && active.id === over.id) {
      setActiveItem(null);
      setHiddenId(null);
      return;
    }

    // Calculate sort order
    const targetItems = itemsByStage[targetStage].filter((i) => i.id !== activeItemData.id);
    const overIndex = over.id === `stage-${targetStage}`
      ? targetItems.length
      : targetItems.findIndex((i) => i.id === over.id);
    const sortOrder = overIndex >= 0 ? overIndex : targetItems.length;

    // Update local items and clear overlay — hiddenId stays until next frame
    setLocalItems((prev) => {
      const rest = prev.filter((p) => p.id !== activeItemData.id);
      const moved = { ...activeItemData, stage: targetStage!, sortOrder };
      const result: ProgressItem[] = [];
      let inserted = false;
      for (const item of rest) {
        if (item.stage === targetStage && !inserted && (item.sortOrder ?? 0) >= sortOrder) {
          result.push(moved);
          inserted = true;
        }
        result.push(item);
      }
      if (!inserted) result.push(moved);
      return result;
    });
    setActiveItem(null);
    // hiddenId is NOT cleared here — the useEffect will clear it
    // after localItems re-render is committed to DOM

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
      onDragEnd={handleDragEnd}
    >
      <div className="flex">
        {STAGES.map((stage) => {
          if (visibleStages && !visibleStages.has(stage)) {
            const count = (itemsByStage[stage] ?? []).length;
            return (
              <div key={stage} className="w-[40px] shrink-0 border-r border-[var(--border)] flex flex-col items-center gap-1 py-2">
                {(itemsByStage[stage] ?? []).slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="w-5 h-1.5 rounded-full bg-[var(--muted-foreground)] opacity-25"
                    title={item.title || item.content}
                  />
                ))}
                {count > 5 && (
                  <span className="text-[8px] text-[var(--muted-foreground)] opacity-40">
                    +{count - 5}
                  </span>
                )}
              </div>
            );
          }
          return (
            <DroppableStage
              key={stage}
              stage={stage}
              items={itemsByStage[stage]}
              businessId={businessId}
              onBlockClick={onBlockClick}
              funnelNo={funnelNumbers?.[stage]}
              onFunnelNoChange={handleFunnelNoChange}
              draggingId={hiddenId}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
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
