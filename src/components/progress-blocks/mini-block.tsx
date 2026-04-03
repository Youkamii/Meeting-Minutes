"use client";

import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { useUIStore } from "@/stores/ui-store";
import type { Stage } from "@/types";

const STAGE_COLORS: Record<Stage, string> = {
  inbound: "border-l-purple-500",
  funnel: "border-l-blue-500",
  pipeline: "border-l-cyan-500",
  proposal: "border-l-yellow-500",
  contract: "border-l-green-500",
  build: "border-l-teal-500",
  maintenance: "border-l-gray-500",
};

interface MiniBlockProps {
  id: string;
  title?: string;
  content: string;
  stage: Stage;
  date?: string | null;
  createdAt: string;
  onClick?: () => void;
}

export function MiniBlock({
  id,
  title,
  content,
  stage,
  date,
  onClick,
}: MiniBlockProps) {
  const displayDate = date || "";
  const ref = useRef<HTMLDivElement>(null);
  const [visited, setVisited] = useState(false);

  const highlightId = useUIStore((s) => s.searchHighlightId);
  const setHighlightId = useUIStore((s) => s.setSearchHighlightId);
  const filterText = useUIStore((s) => s.searchFilterText);

  const isCurrent = highlightId === id;

  // Scroll into view when this card becomes the current target
  useEffect(() => {
    if (isCurrent) {
      setVisited(true);
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [isCurrent]);

  // Clear visited state when filter text changes (new search)
  useEffect(() => {
    setVisited(false);
  }, [filterText]);

  const handleMouseEnter = () => {
    if (visited && !isCurrent) {
      setVisited(false);
      setHighlightId(null);
    }
  };

  const hasHighlight = isCurrent || visited;

  // Determine if dimmed by filter (highlighted cards are never dimmed)
  const searchText = filterText?.toLowerCase() ?? null;
  const isDimmed =
    !hasHighlight &&
    searchText !== null &&
    !(title ?? "").toLowerCase().includes(searchText) &&
    !content.toLowerCase().includes(searchText);

  const borderClass = isCurrent
    ? "border-[3px] border-blue-500 border-l-blue-500"
    : visited
      ? "border-[3px] border-red-500 border-l-red-500"
      : "border border-[var(--border)]";

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={handleMouseEnter}
      className={`cursor-pointer rounded-md border-l-2 ${STAGE_COLORS[stage]} bg-[var(--background)] px-3 py-2.5 text-sm shadow-sm hover:shadow-md transition-all ${borderClass} ${isDimmed ? "opacity-25" : ""}`}
      title={undefined}
    >
      {title && <p className="font-semibold text-[var(--foreground)] whitespace-pre-wrap break-words">{title}</p>}
      {content && /<[a-z][\s\S]*>/i.test(content) ? (
        <div
          className="text-[var(--muted-foreground)] break-words [&_p]:m-0 [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:pl-4 [&_ol]:list-decimal"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      ) : content ? (
        <p className="whitespace-pre-wrap break-words text-[var(--muted-foreground)]">{content}</p>
      ) : null}
      <span className="text-xs text-[var(--muted-foreground)] mt-1 block">{displayDate}</span>
    </div>
  );
}
