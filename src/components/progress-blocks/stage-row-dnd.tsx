"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { MiniBlock } from "./mini-block";
import { useMoveProgressItem, useCreateProgressItem } from "@/hooks/use-progress-items";
import { useUpdateBusiness } from "@/hooks/use-businesses";
import { STAGES } from "@/lib/constants";
import type { ProgressItem, Stage } from "@/types";

// ── Sortable block ──────────────────────────────────────────────
function SortableBlock({
  item,
  onClick,
  isDragging,
}: {
  item: ProgressItem;
  onClick?: () => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
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

// ── Droppable stage column ──────────────────────────────────────
function DroppableStage({
  stage,
  items,
  businessId,
  onBlockClick,
  funnelNo,
  onFunnelNoChange,
  activeId,
}: {
  stage: Stage;
  items: ProgressItem[];
  businessId: string;
  onBlockClick?: (item: ProgressItem) => void;
  funnelNo?: string;
  onFunnelNoChange?: (stage: Stage, value: string) => void;
  activeId?: string | null;
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
          <SortableBlock
            key={item.id}
            item={item}
            onClick={() => onBlockClick?.(item)}
            isDragging={item.id === activeId}
          />
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

// ── Helpers ─────────────────────────────────────────────────────
function getStageForId(id: string, itemsByStage: Record<Stage, ProgressItem[]>): Stage | null {
  if (id.startsWith("stage-")) return id.replace("stage-", "") as Stage;
  for (const stage of STAGES) {
    if (itemsByStage[stage].some((i) => i.id === id)) return stage;
  }
  return null;
}

function buildItemsByStage(items: ProgressItem[]): Record<Stage, ProgressItem[]> {
  return STAGES.reduce((acc, stage) => {
    acc[stage] = items
      .filter((p) => p.stage === stage)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return acc;
  }, {} as Record<Stage, ProgressItem[]>);
}

// Cards first, but always include stage containers for cross-stage moves
const itemsFirstCollision: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  const center = closestCenter(args);

  // If pointer is inside a card, use that
  const pointerCard = pointer.find((c) => !String(c.id).startsWith("stage-"));
  if (pointerCard) return [pointerCard];

  // If pointer is inside a stage container, use it (enables cross-stage)
  const pointerStage = pointer.find((c) => String(c.id).startsWith("stage-"));
  if (pointerStage) return [pointerStage];

  // Fallback to closestCenter
  return center.length > 0 ? [center[0]] : [];
};

// ── Main component ──────────────────────────────────────────────
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

  // Ref to track current local items in event handlers without re-render loops
  const localItemsRef = useRef(localItems);
  localItemsRef.current = localItems;

  // Track origin for "did it actually move?" check
  const originRef = useRef<{ stage: Stage; index: number } | null>(null);

  // Gate to prevent onDragOver re-entry during SortableContext re-measure
  const dragOverLock = useRef(false);

  // Sync from props when not dragging and no mutation in-flight
  useEffect(() => {
    if (!activeItem && !moveItem.isPending) setLocalItems(progressItems);
  }, [progressItems, activeItem, moveItem.isPending]);

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

  const itemsByStage = buildItemsByStage(localItems);

  // ── Drag start ──
  const handleDragStart = (event: DragStartEvent) => {
    const item = localItems.find((p) => p.id === event.active.id);
    if (!item) return;
    setActiveItem(item);
    const stageItems = itemsByStage[item.stage];
    originRef.current = {
      stage: item.stage,
      index: stageItems.findIndex((i) => i.id === item.id),
    };
  };

  // ── Drag over (real-time reorder for both same-stage and cross-stage) ──
  const lastOverIdRef = useRef<string | null>(null);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || dragOverLock.current) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    // Prevent oscillation: don't process the same over target twice in a row
    if (lastOverIdRef.current === overId) return;

    const currentByStage = buildItemsByStage(localItemsRef.current);
    const fromStage = getStageForId(activeId, currentByStage);
    const toStage = getStageForId(overId, currentByStage);
    if (!fromStage || !toStage) return;

    let nextItems: ProgressItem[] | null = null;

    if (fromStage === toStage) {
      // Same stage reorder
      const stageItems = currentByStage[fromStage];
      const oldIdx = stageItems.findIndex((i) => i.id === activeId);
      const newIdx = overId.startsWith("stage-")
        ? stageItems.length - 1
        : stageItems.findIndex((i) => i.id === overId);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

      const reordered = arrayMove(stageItems, oldIdx, newIdx);
      const rest = localItemsRef.current.filter((p) => p.stage !== fromStage);
      nextItems = [...rest, ...reordered.map((item, i) => ({ ...item, sortOrder: i }))];
    } else {
      // Cross-stage move
      const sourceItems = [...currentByStage[fromStage]];
      const destItems = [...currentByStage[toStage]];
      const srcIdx = sourceItems.findIndex((i) => i.id === activeId);
      if (srcIdx === -1) return;

      const [moved] = sourceItems.splice(srcIdx, 1);
      const movedItem = { ...moved, stage: toStage };

      let destIdx: number;
      if (overId.startsWith("stage-")) {
        destIdx = destItems.length;
      } else {
        const overIdx = destItems.findIndex((i) => i.id === overId);
        destIdx = overIdx === -1 ? destItems.length : overIdx;
      }
      destItems.splice(destIdx, 0, movedItem);

      const rest = localItemsRef.current.filter((p) => p.stage !== fromStage && p.stage !== toStage);
      nextItems = [
        ...rest,
        ...sourceItems.map((item, i) => ({ ...item, sortOrder: i })),
        ...destItems.map((item, i) => ({ ...item, sortOrder: i })),
      ];
    }

    if (nextItems) {
      lastOverIdRef.current = overId;
      dragOverLock.current = true;
      setLocalItems(nextItems);
      requestAnimationFrame(() => { dragOverLock.current = false; });
    }
  }, []);

  // ── Drag end (commit to server) ──
  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    setActiveItem(null);
    lastOverIdRef.current = null;

    const activeId = String(active.id);
    const origin = originRef.current;
    originRef.current = null;

    // Find final position from local state (already updated by handleDragOver)
    const finalByStage = buildItemsByStage(localItemsRef.current);
    let finalStage: Stage | null = null;
    let finalIndex = 0;
    for (const stage of STAGES) {
      const idx = finalByStage[stage].findIndex((i) => i.id === activeId);
      if (idx !== -1) {
        finalStage = stage;
        finalIndex = idx;
        break;
      }
    }
    if (!finalStage) return;

    // Skip if nothing changed
    if (origin && origin.stage === finalStage && origin.index === finalIndex) return;

    const item = localItemsRef.current.find((p) => p.id === activeId);
    moveItem.mutate({
      id: activeId,
      targetStage: finalStage,
      sortOrder: finalIndex,
      lockVersion: item?.lockVersion,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={itemsFirstCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
              activeId={activeItem?.id}
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
