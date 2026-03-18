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
  title?: string;
  content: string;
  stage: Stage;
  date?: string | null;
  createdAt: string;
  onClick?: () => void;
}

export function MiniBlock({
  title,
  content,
  stage,
  date,
  createdAt,
  onClick,
}: MiniBlockProps) {
  const displayDate = date
    ? new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
    : new Date(createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`cursor-pointer rounded-md border border-[var(--border)] border-l-2 ${STAGE_COLORS[stage]} bg-[var(--background)] px-3 py-2.5 text-sm shadow-sm hover:shadow-md transition-all`}
      title={title ? `${title}\n${content}` : content}
    >
      {title && <p className="font-semibold text-[var(--foreground)] whitespace-pre-wrap break-words">{title}</p>}
      <p className="whitespace-pre-wrap break-words text-[var(--muted-foreground)]">{content || "내용 없음"}</p>
      <span className="text-xs text-[var(--muted-foreground)] mt-1 block">{displayDate}</span>
    </div>
  );
}
