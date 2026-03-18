"use client";

import { useState, useEffect } from "react";
import { useBusiness } from "@/hooks/use-businesses";
import { useProgressItems } from "@/hooks/use-progress-items";
import { useWeeklyActions } from "@/hooks/use-weekly-actions";
import { useAuditLogs } from "@/hooks/use-activity";
import { StageCell } from "@/components/progress-blocks/stage-cell";
import { ActionCard } from "@/components/weekly-meeting/action-card";
import { NotesContainer } from "@/components/notes/notes-container";
import { VersionHistoryPanel } from "@/components/version-diff/version-history-panel";
import type { Stage, ActionStatus, Priority } from "@/types";

const TABS = [
  "기본 정보",
  "진행상태",
  "주간 액션",
  "내부 메모",
  "파일/참고자료",
  "로그/버전",
] as const;

type Tab = (typeof TABS)[number];

const STAGES: { value: Stage; label: string }[] = [
  { value: "inbound", label: "Inbound" },
  { value: "funnel", label: "Funnel" },
  { value: "pipeline", label: "Pipeline" },
  { value: "proposal", label: "제안" },
  { value: "contract", label: "계약" },
  { value: "build", label: "구축" },
  { value: "maintenance", label: "유지보수" },
];

interface BusinessDetailPanelProps {
  businessId: string;
  onClose: () => void;
}

export function BusinessDetailPanel({
  businessId,
  onClose,
}: BusinessDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("기본 정보");
  const { data, isLoading } = useBusiness(businessId);
  const business = data?.data;

  const { data: progressData } = useProgressItems(
    activeTab === "진행상태" ? businessId : null,
  );
  const { data: actionsData } = useWeeklyActions(
    activeTab === "주간 액션" ? { companyId: (business as unknown as { companyId?: string })?.companyId } : undefined,
  );
  const { data: logsData } = useAuditLogs(
    activeTab === "로그/버전"
      ? { entityType: "business", entityId: businessId, limit: 50 }
      : undefined,
  );

  // Record recent view
  useEffect(() => {
    fetch("/api/recent-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType: "business", entityId: businessId }),
    }).catch(() => {});
  }, [businessId]);

  const progressByStage = (progressData?.data ?? {}) as Record<string, unknown[]>;
  const weeklyActions = (actionsData?.data ?? []).filter(
    (a) => (a as unknown as { businessId?: string }).businessId === businessId,
  );
  const logs = logsData?.data ?? [];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-lg font-bold truncate">
          {isLoading ? "로딩 중..." : business?.name ?? "사업 상세"}
        </h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-[var(--muted)] text-xl"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
        )}

        {/* 기본 정보 */}
        {business && activeTab === "기본 정보" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">사업명</label>
              <p className="text-sm">{business.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">기업</label>
              <p className="text-sm">
                {(business as unknown as { company?: { canonicalName: string } }).company?.canonicalName ?? "—"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">공개여부</label>
                <p className="text-sm">{business.visibility === "public" ? "공개" : "비공개"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">사업규모</label>
                <p className="text-sm">{business.scale ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">사업시기</label>
                <p className="text-sm">{business.timingText ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">현재 단계</label>
                <p className="text-sm">{business.currentStage ?? "—"}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">기간</label>
              <p className="text-sm">
                {business.timingStart ?? "—"} ~ {business.timingEnd ?? "—"}
              </p>
            </div>
          </div>
        )}

        {/* 진행상태 */}
        {activeTab === "진행상태" && (
          <div className="space-y-4">
            {STAGES.map((stage) => {
              const items = ((progressByStage[stage.value] as unknown[]) ?? []) as Array<{
                id: string;
                businessId: string;
                stage: Stage;
                content: string;
                sortOrder: number;
                createdBy: string | null;
                updatedBy: string | null;
                createdAt: string;
                updatedAt: string;
                lockVersion: number;
              }>;
              return (
                <div key={stage.value}>
                  <h3 className="text-sm font-semibold mb-1">{stage.label}</h3>
                  <StageCell
                    businessId={businessId}
                    stage={stage.value}
                    items={items}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* 주간 액션 */}
        {activeTab === "주간 액션" && (
          <div className="space-y-2">
            {weeklyActions.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                이 사업에 연결된 주간 액션이 없습니다.
              </p>
            ) : (
              weeklyActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action as unknown as {
                    id: string;
                    content: string;
                    status: ActionStatus;
                    priority: Priority;
                    assignedToId: string | null;
                    carryoverCount: number;
                    carriedFromId: string | null;
                    lockVersion: number;
                    company?: { canonicalName: string };
                    business?: { name: string } | null;
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* 내부 메모 */}
        {activeTab === "내부 메모" && (
          <NotesContainer ownerType="business" ownerId={businessId} />
        )}

        {/* 파일/참고자료 */}
        {activeTab === "파일/참고자료" && (
          <p className="text-sm text-[var(--muted-foreground)]">
            파일 첨부는 향후 버전에서 지원될 예정입니다.
          </p>
        )}

        {/* 로그/버전 */}
        {activeTab === "로그/버전" && (
          <div className="space-y-6">
            <VersionHistoryPanel entityType="business" entityId={businessId} />
            <div>
              <h3 className="text-sm font-bold mb-2">감사 로그</h3>
              {logs.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">로그가 없습니다.</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-md bg-[var(--muted)] px-3 py-2 text-xs">
                      <span className="font-medium capitalize">{log.action}</span>
                      {log.summary && <span className="text-[var(--muted-foreground)]"> — {log.summary}</span>}
                      <div className="text-[var(--muted-foreground)]">
                        {new Date(log.createdAt).toLocaleString("ko-KR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
