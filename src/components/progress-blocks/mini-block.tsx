"use client";

import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { useUIStore } from "@/stores/ui-store";
import type { Stage } from "@/types";

const STAGE_COLORS: Record<Stage, string> = {
  inbound: "border-l-[var(--stage-inbound)]",
  funnel: "border-l-[var(--stage-funnel)]",
  pipeline: "border-l-[var(--stage-pipeline)]",
  proposal: "border-l-[var(--stage-proposal)]",
  contract: "border-l-[var(--stage-contract)]",
  build: "border-l-[var(--stage-build)]",
  maintenance: "border-l-[var(--stage-maintenance)]",
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
    !content.replace(/<br\s*\/?>/gi, " ").replace(/<\/p>\s*<p[^>]*>/gi, " ").replace(/<[^>]*>/g, "").toLowerCase().includes(searchText);

  const borderClass = isCurrent
    ? "border-[3px] border-[var(--link)] border-l-[var(--link)]"
    : visited
      ? "border-[3px] border-[var(--destructive)] border-l-[var(--destructive)]"
      : "border border-[var(--border)]";

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={handleMouseEnter}
      className={`cursor-pointer rounded-md border-l-4 ${STAGE_COLORS[stage]} px-3 py-2.5 text-sm shadow-sm hover:shadow-md transition-all ${borderClass} ${isDimmed ? "opacity-25" : ""}`}
      style={{ background: "var(--background)" }}
      title={undefined}
    >
      {title && <p className="font-semibold text-[15px] text-[var(--foreground)] whitespace-pre-wrap break-words">{title}</p>}
      {content ? (
        /<[a-z][\s\S]*>/i.test(content) ? (
          <div
            className="text-[var(--muted-foreground)] break-words mt-0.5 [&_p]:m-0 [&_p+p]:mt-1.5 [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:pl-4 [&_ol]:list-decimal"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          />
        ) : (
          <p className="whitespace-pre-wrap break-words text-[var(--muted-foreground)] mt-0.5">{content}</p>
        )
      ) : null}
      <span className="text-xs text-[var(--muted-foreground)] mt-1 block">{displayDate}</span>
    </div>
  );
}
