"use client";

import { useState } from "react";
import { useVersions } from "@/hooks/use-versions";
import type { Version } from "@/types";

interface VersionHistoryPanelProps {
  entityType: string;
  entityId: string;
  onSelectVersion?: (version: Version) => void;
  onCompare?: (versionA: Version, versionB: Version) => void;
}

export function VersionHistoryPanel({
  entityType,
  entityId,
  onSelectVersion,
  onCompare,
}: VersionHistoryPanelProps) {
  const { data, isLoading } = useVersions(entityType, entityId);
  const versions = data?.data ?? [];

  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleCompareSelect = (version: Version) => {
    setSelectedIds((prev) => {
      if (prev.includes(version.id)) {
        return prev.filter((id) => id !== version.id);
      }
      if (prev.length >= 2) {
        return [prev[1], version.id];
      }
      return [...prev, version.id];
    });
  };

  const handleCompare = () => {
    if (selectedIds.length !== 2 || !onCompare) return;
    const a = versions.find((v) => v.id === selectedIds[0]);
    const b = versions.find((v) => v.id === selectedIds[1]);
    if (a && b) onCompare(a, b);
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">버전 히스토리</h3>
        <button
          onClick={() => {
            setCompareMode(!compareMode);
            setSelectedIds([]);
          }}
          className={`rounded px-2 py-1 text-xs transition-colors ${
            compareMode
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "border border-[var(--border)] hover:bg-[var(--muted)]"
          }`}
        >
          {compareMode ? "비교 취소" : "비교"}
        </button>
      </div>

      {isLoading && (
        <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
      )}

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {versions.map((version) => {
          const isSelected = selectedIds.includes(version.id);
          return (
            <button
              key={version.id}
              onClick={() =>
                compareMode
                  ? toggleCompareSelect(version)
                  : onSelectVersion?.(version)
              }
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                isSelected
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "hover:bg-[var(--muted)]"
              }`}
            >
              <span className="font-medium">v{version.versionNumber}</span>
              <span className="flex-1 text-xs text-[var(--muted-foreground)]">
                {new Date(version.createdAt).toLocaleString("ko-KR")}
              </span>
            </button>
          );
        })}
      </div>

      {versions.length === 0 && !isLoading && (
        <p className="text-sm text-[var(--muted-foreground)]">
          버전이 없습니다.
        </p>
      )}

      {compareMode && selectedIds.length === 2 && (
        <button
          onClick={handleCompare}
          className="mt-3 w-full rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          선택 항목 비교
        </button>
      )}
    </div>
  );
}
