"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/use-activity";

type Filter = "all" | "changes" | "views";

export function ActivityFeed() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading } = useAuditLogs({ limit: 20 });

  const logs = data?.data ?? [];

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">최근 활동</h2>
        <div className="flex gap-1">
          {(["all", "changes", "views"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-0.5 text-xs transition-colors ${
                filter === f
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              {f === "all" ? "전체" : f === "changes" ? "변경사항" : "내 조회"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
      )}

      {!isLoading && logs.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)]">
          최근 활동이 없습니다.
        </p>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--muted)] transition-colors"
          >
            <span className="mt-0.5 text-xs">
              {log.action === "create"
                ? "➕"
                : log.action === "update"
                  ? "✏️"
                  : log.action === "delete"
                    ? "🗑️"
                    : log.action === "move"
                      ? "↔️"
                      : log.action === "carryover"
                        ? "↻"
                        : "•"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs">
                <span className="font-medium capitalize">
                  {log.action}
                </span>{" "}
                <span className="text-[var(--muted-foreground)]">
                  {log.entityType}
                </span>
                {log.summary && (
                  <span className="text-[var(--muted-foreground)]">
                    {" "}— {log.summary}
                  </span>
                )}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                {new Date(log.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
