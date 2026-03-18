"use client";

import { useState } from "react";
import { useBusiness } from "@/hooks/use-businesses";

const TABS = [
  "기본 정보",
  "진행상태",
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
  const business = data?.data;

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

        {business && activeTab === "기본 정보" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                사업명
              </label>
              <p className="text-sm">{business.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                기업
              </label>
              <p className="text-sm">
                {(business as unknown as { company?: { canonicalName: string } })
                  .company?.canonicalName ?? "—"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  공개여부
                </label>
                <p className="text-sm">{business.visibility}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  사업규모
                </label>
                <p className="text-sm">{business.scale ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  사업시기
                </label>
                <p className="text-sm">{business.timingText ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  현재 단계
                </label>
                <p className="text-sm">{business.currentStage ?? "—"}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                기간
              </label>
              <p className="text-sm">
                {business.timingStart ?? "—"} ~ {business.timingEnd ?? "—"}
              </p>
            </div>
          </div>
        )}

        {activeTab === "진행상태" && (
          <p className="text-sm text-[var(--muted-foreground)]">
            진행 블록은 US2에서 추가될 예정입니다.
          </p>
        )}

        {activeTab === "주간 액션" && (
          <p className="text-sm text-[var(--muted-foreground)]">
            주간 액션은 US3에서 추가될 예정입니다.
          </p>
        )}

        {activeTab === "내부 메모" && (
          <p className="text-sm text-[var(--muted-foreground)]">
            내부 메모는 Phase 14에서 추가될 예정입니다.
          </p>
        )}

        {activeTab === "파일/참고자료" && (
          <p className="text-sm text-[var(--muted-foreground)]">
            파일 첨부는 향후 버전에서 지원될 예정입니다.
          </p>
        )}

        {activeTab === "로그/버전" && (
          <p className="text-sm text-[var(--muted-foreground)]">
            감사 로그와 버전 히스토리는 US8/US9에서 추가될 예정입니다.
          </p>
        )}
      </div>
    </div>
  );
}
