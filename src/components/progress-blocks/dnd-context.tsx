"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MiniBlock } from "./mini-block";
import { useMoveProgressItem } from "@/hooks/use-progress-items";
import type { ProgressItem, Stage } from "@/types";

interface SortableBlockProps {
  item: ProgressItem;
  onClick?: () => void;
}

function SortableBlock({ item, onClick }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MiniBlock
        id={item.id}
        content={item.content}
        stage={item.stage}
        createdAt={item.createdAt}
        onClick={onClick}
      />
    </div>
  );
}

interface DndStageColumnProps {
  stage: Stage;
  items: ProgressItem[];
  onBlockClick?: (item: ProgressItem) => void;
}

export function DndStageColumn({
  items,
  onBlockClick,
}: DndStageColumnProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const moveItem = useMoveProgressItem();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeItem = items.find((i) => i.id === active.id);
    if (!activeItem) return;

    const overIndex = items.findIndex((i) => i.id === over.id);

    moveItem.mutate({
      id: activeItem.id,
      targetStage: activeItem.stage,
      sortOrder: overIndex,
      lockVersion: activeItem.lockVersion,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <SortableBlock
              key={item.id}
              item={item}
              onClick={() => onBlockClick?.(item)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
