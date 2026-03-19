"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUIStore } from "@/stores/ui-store";
import { useCompanies, useReorderCompanies } from "@/hooks/use-companies";
import { useBusinesses } from "@/hooks/use-businesses";
import { CompanyGroupRow } from "@/components/business-table/company-group-row";
import { BusinessRow } from "@/components/business-table/business-row";
import { BusinessDetailPanel } from "@/components/business-table/business-detail-panel";
import { NewCompanyDialog } from "@/components/business-table/new-company-dialog";
import { NewBusinessDialog } from "@/components/business-table/new-business-dialog";
import { QuickActionsBar } from "@/components/ui/quick-actions";
import { ExcelDownloadDialog } from "@/components/export/excel-download-dialog";
import type { Company, Business } from "@/types";

const STAGES_CONFIG: { key: string; label: string }[] = [
  { key: "inbound", label: "Inbound(초도미팅)" },
  { key: "funnel", label: "Funnel" },
  { key: "pipeline", label: "Pipeline" },
  { key: "proposal", label: "제안" },
  { key: "contract", label: "계약" },
  { key: "build", label: "구축" },
  { key: "maintenance", label: "유지보수" },
];
const ALL_STAGE_KEYS = STAGES_CONFIG.map((s) => s.key);

function SortableCompanyGroup({
  companyId,
  children,
}: {
  companyId: string;
  children: (handleProps: Record<string, unknown>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: companyId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

export default function BusinessManagementPage() {
  const [search, setSearch] = useState("");
  const [showKeyOnly, setShowKeyOnly] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    null,
  );
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewBusiness, setShowNewBusiness] = useState(false);
  const [showExcelDownload, setShowExcelDownload] = useState(false);
  const [visibleStages, setVisibleStages] = useState<Set<string>>(
    new Set(ALL_STAGE_KEYS),
  );

  const toggleStage = (key: string) => {
    setVisibleStages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev; // 최소 1개는 유지
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Filter text sync to store (for MiniBlock dimming)
  const setFilterText = useUIStore((s) => s.setSearchFilterText);
  const setHighlightId = useUIStore((s) => s.setSearchHighlightId);
  const filterTextRef = useRef<string | null>(null);

  // Local match navigation state (NOT in zustand to avoid render loops)
  const [matchIndex, setMatchIndex] = useState(-1);
  const matchIdsRef = useRef<string[]>([]);

  // Disable body scroll so only our container scrolls (via CSS class for safety)
  useEffect(() => {
    document.documentElement.classList.add("overflow-hidden");
    return () => {
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, []);

  const { data: companiesData, isLoading: companiesLoading } = useCompanies({
    isKey: showKeyOnly ? true : undefined,
  });
  const { data: businessesData, isLoading: businessesLoading } = useBusinesses({});

  const companies = companiesData?.data ?? [];
  const businesses = businessesData?.data ?? [];

  // Only consider businesses belonging to visible companies
  const visibleCompanyIds = useMemo(
    () => new Set(companies.map((c: Company) => c.id)),
    [companies],
  );
  const visibleBusinesses = useMemo(
    () => businesses.filter((b: Business) => visibleCompanyIds.has(b.companyId)),
    [businesses, visibleCompanyIds],
  );

  // Compute match IDs from search text (only within visible businesses)
  const filterMatchIds = useMemo(() => {
    if (search.length < 2) return [];
    const lc = search.toLowerCase();
    const ids: string[] = [];
    for (const biz of visibleBusinesses) {
      const items = (biz as Business & { progressItems?: { id: string; title?: string; content: string; stage: string }[] }).progressItems ?? [];
      for (const item of items) {
        if (!visibleStages.has(item.stage)) continue;
        if (
          (item.title ?? "").toLowerCase().includes(lc) ||
          item.content.toLowerCase().includes(lc)
        ) {
          ids.push(item.id);
        }
      }
    }
    return ids;
  }, [search, visibleBusinesses, visibleStages]);

  // Keep ref in sync for Enter handler
  matchIdsRef.current = filterMatchIds;

  // Sync filter text to store — only when it actually changes
  useEffect(() => {
    const newVal = search.length >= 2 ? search : null;
    if (filterTextRef.current !== newVal) {
      filterTextRef.current = newVal;
      setFilterText(newVal);
      setMatchIndex(-1);
    }
  }, [search, setFilterText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { setFilterText(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToNextMatch = () => {
    const ids = matchIdsRef.current;
    if (ids.length === 0) return;
    const next = (matchIndex + 1) % ids.length;
    setMatchIndex(next);
    setHighlightId(ids[next]);
  };

  // Group businesses by company, sorted by sortOrder
  const groupedData = useMemo(() => {
    const sortedCompanies = [...companies].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    return sortedCompanies.map((company) => ({
      company,
      businesses: businesses.filter(
        (b: Business) => b.companyId === company.id,
      ),
    }));
  }, [companies, businesses]);

  const isLoading = companiesLoading || businessesLoading;

  // DnD for company reordering
  const reorderCompanies = useReorderCompanies();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const company = companies.find((c: Company) => c.id === event.active.id);
    setActiveCompany(company ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCompany(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sortedIds = groupedData.map((g) => g.company.id);
    const oldIndex = sortedIds.indexOf(active.id as string);
    const newIndex = sortedIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...sortedIds];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    reorderCompanies.mutate(reordered);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        <h1 className="text-lg font-bold">사업관리</h1>

        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filterMatchIds.length > 0) {
                e.preventDefault();
                goToNextMatch();
              }
            }}
            placeholder="카드 필터링... (Enter로 이동)"
            aria-label="카드 필터링"
            className={`h-8 w-64 rounded-md border bg-[var(--muted)] px-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors ${
              search.length >= 2
                ? "border-[var(--primary)] bg-[var(--primary)]/5"
                : "border-[var(--border)]"
            }`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              title="필터 해제"
            >
              ✕
            </button>
          )}
        </div>

        {search.length >= 2 && (
          <span className="text-xs text-[var(--primary)] font-medium tabular-nums">
            {filterMatchIds.length === 0
              ? "결과 없음"
              : matchIndex >= 0
                ? `(${matchIndex + 1}/${filterMatchIds.length})`
                : `${filterMatchIds.length}건`}
          </span>
        )}

        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showKeyOnly}
            onChange={(e) => setShowKeyOnly(e.target.checked)}
            className="rounded"
          />
          중요기업만
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowExcelDownload(true)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)] transition-colors"
          >
            엑셀 다운로드
          </button>
          <QuickActionsBar
            actions={[
              { label: "기업", onClick: () => setShowNewCompany(true) },
              { label: "사업", onClick: () => setShowNewBusiness(true) },
            ]}
          />
        </div>
      </div>

      {/* Table — single scroll container for both axes, fills remaining viewport */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
          </div>
        )}

        {!isLoading && groupedData.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <p className="text-lg font-medium">
              {showKeyOnly ? "중요 기업으로 등록된 기업이 없습니다" : "등록된 기업이 없습니다"}
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {showKeyOnly
                ? "기업 목록에서 ★를 눌러 중요 기업으로 지정하세요."
                : "첫 번째 기업을 생성하여 시작하세요."}
            </p>
            {!showKeyOnly && (
              <button
                onClick={() => setShowNewCompany(true)}
                className="mt-4 rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90"
              >
                + 새 기업
              </button>
            )}
          </div>
        )}

        {/* Inner wide content */}
        <div className="w-max min-w-full">
          {/* Stage column headers */}
          {groupedData.length > 0 && (
            <div className="sticky top-0 z-10 flex border-b border-[var(--border)] bg-[var(--background)]">
              <div className="sticky left-0 z-20 w-[280px] shrink-0 border-r border-[var(--border)] bg-[var(--background)] px-4 py-2">
                <span className="text-sm font-semibold text-[var(--muted-foreground)]">
                  사업 정보
                </span>
              </div>
              {STAGES_CONFIG.map(({ key, label }) => {
                const active = visibleStages.has(key);
                return (
                  <div
                    key={key}
                    onClick={() => toggleStage(key)}
                    className={`shrink-0 border-r border-[var(--border)] cursor-pointer select-none transition-all ${
                      active
                        ? "w-[300px] px-2 py-2 hover:bg-[var(--muted)]"
                        : "w-[40px] px-1 py-2 bg-[var(--muted)] opacity-40 hover:opacity-70"
                    }`}
                    title={active ? `${label} 숨기기` : `${label} 표시`}
                  >
                    <span className={`text-xs font-semibold text-[var(--muted-foreground)] uppercase ${
                      active ? "" : "writing-mode-vertical"
                    }`}
                      style={active ? undefined : { writingMode: "vertical-rl", textOrientation: "mixed" }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={groupedData.map((g) => g.company.id)}
              strategy={verticalListSortingStrategy}
            >
              {groupedData.map(({ company, businesses: bizList }) => (
                <SortableCompanyGroup key={company.id} companyId={company.id}>
                  {(dragHandleProps) => (
                    <CompanyGroupRow
                      company={company}
                      businessCount={bizList.length}
                      dragHandleProps={dragHandleProps}
                    >
                      {bizList.length === 0 && (
                        <div className="px-8 py-3 text-xs text-[var(--muted-foreground)]">
                          등록된 사업이 없습니다.{" "}
                          <button
                            onClick={() => setShowNewBusiness(true)}
                            className="text-[var(--primary)] hover:underline"
                          >
                            추가하기
                          </button>
                        </div>
                      )}
                      {bizList.map((biz: Business) => (
                        <BusinessRow
                          key={biz.id}
                          business={{ ...biz, companyName: company.canonicalName }}
                          onClick={() => setSelectedBusinessId(biz.id)}
                          visibleStages={visibleStages}
                        />
                      ))}
                    </CompanyGroupRow>
                  )}
                </SortableCompanyGroup>
              ))}
            </SortableContext>

            <DragOverlay>
              {activeCompany && (
                <div className="opacity-80 rotate-1 scale-[1.02] shadow-lg rounded-md">
                  <div className="flex items-center gap-2 bg-[var(--muted)] border border-[var(--border)] rounded-md px-4 py-2">
                    <span className="text-lg text-yellow-500">
                      {activeCompany.isKey ? "★" : ""}
                    </span>
                    <span className="font-semibold text-sm">
                      {activeCompany.canonicalName}
                    </span>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedBusinessId && (
        <BusinessDetailPanel
          businessId={selectedBusinessId}
          onClose={() => setSelectedBusinessId(null)}
        />
      )}

      {/* Dialogs */}
      <NewCompanyDialog
        open={showNewCompany}
        onClose={() => setShowNewCompany(false)}
      />
      <NewBusinessDialog
        open={showNewBusiness}
        onClose={() => setShowNewBusiness(false)}
        companies={companies as Company[]}
      />
      <ExcelDownloadDialog
        open={showExcelDownload}
        onClose={() => setShowExcelDownload(false)}
        defaultType="monthly"
      />
    </div>
  );
}
