"use client";

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
  content: string;
  stage: Stage;
  createdAt: string;
  onClick?: () => void;
}

export function MiniBlock({
  content,
  stage,
  createdAt,
  onClick,
}: MiniBlockProps) {
  const date = new Date(createdAt).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`cursor-pointer rounded border-l-2 ${STAGE_COLORS[stage]} bg-[var(--muted)] px-2 py-1 text-xs hover:bg-[var(--accent)] transition-colors`}
      title={content}
    >
      <p className="truncate">{content}</p>
      <span className="text-[10px] text-[var(--muted-foreground)]">{date}</span>
    </div>
  );
}
