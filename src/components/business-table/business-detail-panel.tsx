"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBusiness, useUpdateBusiness, useArchiveBusiness } from "@/hooks/use-businesses";
import { useWeeklyActions } from "@/hooks/use-weekly-actions";
import { useAuditLogs } from "@/hooks/use-activity";
import { ActionCard } from "@/components/weekly-meeting/action-card";
import { NotesContainer } from "@/components/notes/notes-container";
import { VersionHistoryPanel } from "@/components/version-diff/version-history-panel";
import type { WeeklyActionWithRelations, BusinessWithCompany } from "@/types";

const TABS = [
  "기본 정보",
  "주간 액션",
  "내부 메모",
  "파일/참고자료",
  "로그/버전",
] as const;

type Tab = (typeof TABS)[number];

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
  const updateBusiness = useUpdateBusiness();
  const business = data?.data as BusinessWithCompany | undefined;
  const archiveBusiness = useArchiveBusiness();

  // Ref to always have the latest business for handleSave (avoids stale lockVersion)
  const businessRef = useRef(business);
  useEffect(() => {
    businessRef.current = business;
  }, [business]);

  // Track which business id we've synced form for (prevent refetch overwriting edits)
  const syncedIdRef = useRef<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [embargoName, setEmbargoName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [scale, setScale] = useState("");
  const [timingText, setTimingText] = useState("");
  const [timingStart, setTimingStart] = useState("");
  const [timingEnd, setTimingEnd] = useState("");

  // Sync form only when business.id changes
  useEffect(() => {
    if (business && business.id !== syncedIdRef.current) {
      syncedIdRef.current = business.id;
      setName(business.name);
      setEmbargoName((business as Record<string, unknown>).embargoName as string ?? "");
      setVisibility(business.visibility);
      setScale(business.scale ?? "");
      setTimingText(business.timingText ?? "");
      setTimingStart(business.timingStart ? String(business.timingStart).slice(0, 10) : "");
      setTimingEnd(business.timingEnd ? String(business.timingEnd).slice(0, 10) : "");
    }
  }, [business]);

  // Auto-save on field blur
  const handleSave = useCallback(() => {
    const biz = businessRef.current;
    if (!biz) return;
    const changes: Record<string, unknown> = {};
    if (name.trim() && name.trim() !== biz.name) changes.name = name.trim();
    const bizEmbargoName = (biz as Record<string, unknown>).embargoName as string | null;
    if (embargoName !== (bizEmbargoName ?? "")) changes.embargoName = embargoName || null;
    if (visibility !== biz.visibility) changes.visibility = visibility;
    if (scale !== (biz.scale ?? "")) changes.scale = scale || null;
    if (timingText !== (biz.timingText ?? "")) changes.timingText = timingText || null;
    const bStart = biz.timingStart ? String(biz.timingStart).slice(0, 10) : "";
    const bEnd = biz.timingEnd ? String(biz.timingEnd).slice(0, 10) : "";
    if (timingStart !== bStart) changes.timingStart = timingStart || null;
    if (timingEnd !== bEnd) changes.timingEnd = timingEnd || null;

    if (Object.keys(changes).length > 0) {
      updateBusiness.mutate({
        id: businessId,
        lockVersion: biz.lockVersion,
        ...changes,
      });
    }
  }, [businessId, name, embargoName, visibility, scale, timingText, timingStart, timingEnd, updateBusiness]);

  // Data for tabs
  const { data: actionsData } = useWeeklyActions(
    activeTab === "주간 액션"
      ? { companyId: business?.companyId }
      : undefined,
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

  const weeklyActions = (actionsData?.data ?? []).filter(
    (a) => a.businessId === businessId,
  );
  const logs = logsData?.data ?? [];

  const inputClass =
    "w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]";

  const headerName = (() => {
    if (isLoading) return "로딩 중...";
    if (!business) return "사업 상세";
    if (visibility === "private" && embargoName) {
      return embargoName;
    }
    return business.name;
  })();

  const companyLabel = business?.company?.canonicalName;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className={`text-lg font-bold truncate ${visibility === "private" && embargoName ? "text-red-900 dark:text-red-400" : ""}`}>
            {headerName}
          </h2>
          {companyLabel && (
            <span className="text-sm text-[var(--muted-foreground)] truncate shrink-0">
              {companyLabel}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            handleSave();
            syncedIdRef.current = null;
            onClose();
          }}
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

        {/* 기본 정보 — 바로 수정 가능, blur 시 자동 저장 */}
        {business && activeTab === "기본 정보" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">사업명</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSave}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">공개여부</label>
                <select
                  value={visibility}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setVisibility(newVal);
                    const biz = businessRef.current;
                    if (biz && newVal !== biz.visibility) {
                      updateBusiness.mutate({
                        id: businessId,
                        lockVersion: biz.lockVersion,
                        visibility: newVal,
                      });
                    }
                  }}
                  className={inputClass}
                >
                  <option value="public">공개</option>
                  <option value="private">엠바고</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">사업규모</label>
                <input
                  type="text"
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  onBlur={handleSave}
                  placeholder="예: 5억"
                  className={inputClass}
                />
              </div>
            </div>
            {visibility === "private" && (
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">엠바고 표시명</label>
                <input
                  type="text"
                  value={embargoName}
                  onChange={(e) => setEmbargoName(e.target.value)}
                  onBlur={handleSave}
                  placeholder="비공개 시 표시할 이름"
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">사업시기 (텍스트)</label>
              <input
                type="text"
                value={timingText}
                onChange={(e) => setTimingText(e.target.value)}
                onBlur={handleSave}
                placeholder="예: 2026 상반기"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">시작일</label>
                <input
                  type="date"
                  value={timingStart}
                  onChange={(e) => { setTimingStart(e.target.value); }}
                  onBlur={handleSave}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">종료일</label>
                <input
                  type="date"
                  value={timingEnd}
                  onChange={(e) => { setTimingEnd(e.target.value); }}
                  onBlur={handleSave}
                  className={inputClass}
                />
              </div>
            </div>

            {/* 사업 종료/재개 */}
            <div className="pt-4 mt-4 border-t border-[var(--border)] flex justify-end">
              {business.isArchived ? (
                <button
                  onClick={() => {
                    if (confirm("사업을 재개하시겠습니까?")) {
                      archiveBusiness.mutate({ id: businessId, action: "restore" });
                    }
                  }}
                  className="rounded-md border border-[var(--primary)] px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                >
                  사업 재개
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm("사업 종료 처리 하시겠습니까?")) {
                      archiveBusiness.mutate({ id: businessId, action: "archive" });
                    }
                  }}
                  className="rounded-md border border-[var(--destructive)] px-4 py-2 text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
                >
                  사업 종료
                </button>
              )}
            </div>
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
                  action={action as WeeklyActionWithRelations}
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
