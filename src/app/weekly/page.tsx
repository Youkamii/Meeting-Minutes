"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import {
  useCurrentCycle,
  useWeeklyCycles,
  useWeeklyActions,
  useWeeklyActionsMultiCycle,
  useCreateWeeklyAction,
  useUpdateWeeklyAction,
  useEnsureCycle,
} from "@/hooks/use-weekly-actions";
import { useCompanies } from "@/hooks/use-companies";
import { InlineEditor } from "@/components/editor/inline-editor";
import { ExcelDownloadDialog } from "@/components/export/excel-download-dialog";
import { NewActionDialog } from "@/components/weekly-meeting/new-action-dialog";
import { CarryoverDialog } from "@/components/weekly-meeting/carryover-dialog";
import { WeekEndActions } from "@/components/weekly-meeting/week-end-actions";
import { QuickActionsBar } from "@/components/ui/quick-actions";
import { MeetingModeToggle } from "@/components/meeting-mode/meeting-mode-toggle";
import { MeetingModeView } from "@/components/meeting-mode/meeting-mode-view";
import { useUIStore } from "@/stores/ui-store";
import { getWeeksInMonth, formatMonthLabel, formatWeekLabel } from "@/lib/weekly-cycle";
import type { Company, WeeklyAction, WeeklyActionWithRelations } from "@/types";

/* --- Status helpers --- */
const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-gray-400",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  on_hold: "bg-yellow-500",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "예정",
  in_progress: "진행중",
  completed: "완료",
  on_hold: "보류",
};

function StatusBadge({ status, onClick }: { status: string; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={`inline-block text-[9px] text-white px-1.5 py-0.5 rounded-full leading-none ${STATUS_COLORS[status] ?? "bg-gray-400"} ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* --- MonthPicker with outside-click close --- */
function MonthPicker({
  year,
  month,
  onPrev,
  onNext,
  onChange,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onChange: (y: number, m: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <button onClick={onPrev} className="px-2 py-1 rounded hover:bg-[var(--muted)] text-sm">
        ←
      </button>
      <button
        onClick={() => { setPickerYear(year); setOpen(!open); }}
        className="text-sm font-medium w-24 text-center rounded hover:bg-[var(--muted)] py-1 cursor-pointer"
      >
        {formatMonthLabel(year, month)}
      </button>
      <button onClick={onNext} className="px-2 py-1 rounded hover:bg-[var(--muted)] text-sm">
        →
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 shadow-lg w-[220px]">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setPickerYear(pickerYear - 1)}
              className="text-sm px-1 hover:bg-[var(--muted)] rounded"
            >
              ←
            </button>
            <span className="text-sm font-bold">{pickerYear}년</span>
            <button
              onClick={() => setPickerYear(pickerYear + 1)}
              className="text-sm px-1 hover:bg-[var(--muted)] rounded"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {months.map((m) => (
              <button
                key={m}
                onClick={() => { onChange(pickerYear, m); setOpen(false); }}
                className={`rounded px-2 py-1.5 text-xs transition-colors ${
                  pickerYear === year && m === month
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "hover:bg-[var(--muted)]"
                }`}
              >
                {m}월
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Types --- */
type MonthCycle = { year: number; weekNumber: number; weekInMonth: number; cycleId: string | null };
type EditingCell = {
  companyId: string;
  cycleId: string;
  weekYear: number;
  weekNumber: number;
  actionId?: string;
  status: string;
} | null;

/* --- Company Row --- */
function WeeklyCompanyRow({
  company,
  monthCycles,
  cycleMap,
  editingCell,
  collapsedWeeks,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onStatusChange,
  onActionStatusChange,
}: {
  company: Company;
  monthCycles: MonthCycle[];
  cycleMap: Map<string, (WeeklyAction & { company?: { id: string; canonicalName: string; isKey: boolean } })[]> | undefined;
  editingCell: EditingCell;
  collapsedWeeks: Set<string>;
  onStartEdit: (companyId: string, cycleId: string | null, weekYear: number, weekNumber: number, action?: WeeklyAction) => void;
  onSaveEdit: (html: string) => void;
  onCancelEdit: () => void;
  onStatusChange: (status: string) => void;
  onActionStatusChange: (actionId: string, lockVersion: number, newStatus: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const hasContent = monthCycles.some((w) => {
    if (!w.cycleId || !cycleMap) return false;
    return (cycleMap.get(w.cycleId) ?? []).length > 0;
  });

  return (
    <div className="border-b-2 border-[var(--border)]">
      <div className="flex hover:bg-[var(--accent)]/30 transition-colors">
        {/* Company name - sticky */}
        <div
          className="sticky left-0 z-[5] w-[220px] shrink-0 border-r border-[var(--border)] bg-[var(--background)] px-3 py-2.5 flex items-start gap-1.5 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {expanded ? "▼" : "▶"}
          </span>
          {company.isKey && (
            <span className="text-yellow-500 text-sm">★</span>
          )}
          <span className="text-sm font-bold truncate">
            {company.canonicalName}
          </span>
          {!expanded && hasContent && (
            <span className="text-[10px] text-[var(--muted-foreground)] ml-auto">...</span>
          )}
        </div>

        {/* Week cells */}
        {expanded && monthCycles.map((w) => {
          const wKey = `${w.year}-${w.weekNumber}`;
          const weekCollapsed = collapsedWeeks.has(wKey);
          const cycleId = w.cycleId;
          const cellActions = cycleId && cycleMap
            ? cycleMap.get(cycleId) ?? []
            : [];

          if (weekCollapsed) {
            return (
              <div key={wKey} className="w-[40px] shrink-0 border-r border-[var(--border)] flex flex-col items-center gap-1 py-2">
                {cellActions.slice(0, 3).map((a) => (
                  <div key={a.id} className="w-5 h-1.5 rounded-full bg-[var(--muted-foreground)] opacity-25" />
                ))}
                {cellActions.length > 3 && (
                  <span className="text-[8px] text-[var(--muted-foreground)] opacity-40">+{cellActions.length - 3}</span>
                )}
              </div>
            );
          }

          return (
            <div
              key={wKey}
              className="w-[320px] shrink-0 border-r border-[var(--border)] px-2 py-2 flex flex-col gap-1.5 cursor-pointer min-h-[48px]"
              onClick={() => {
                if (!editingCell) {
                  onStartEdit(company.id, cycleId, w.year, w.weekNumber, undefined);
                }
              }}
            >
              {cellActions.map((action) => {
                const isEditing = editingCell?.actionId === action.id;

                return isEditing ? (
                  <InlineEditor
                    key={action.id}
                    content={action.content}
                    onSave={onSaveEdit}
                    onCancel={onCancelEdit}
                    status={editingCell?.status ?? action.status}
                    onStatusChange={onStatusChange}
                  />
                ) : (
                  <div
                    key={action.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartEdit(company.id, cycleId, w.year, w.weekNumber, action);
                    }}
                    className="group rounded bg-[var(--muted)] px-2.5 py-1.5 text-sm font-medium cursor-pointer hover:bg-[var(--accent)] transition-colors break-words [&_p]:m-0 [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:pl-4 [&_ol]:list-decimal"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <StatusBadge
                        status={action.status}
                        onClick={() => {
                          // Cycle through statuses on click
                          const statuses = ["scheduled", "in_progress", "completed", "on_hold"];
                          const idx = statuses.indexOf(action.status);
                          const next = statuses[(idx + 1) % statuses.length];
                          onActionStatusChange(action.id, action.lockVersion, next);
                        }}
                      />
                    </div>
                    <div
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(action.content) }}
                    />
                  </div>
                );
              })}

              {editingCell?.companyId === company.id &&
               editingCell?.weekYear === w.year &&
               editingCell?.weekNumber === w.weekNumber &&
               !editingCell?.actionId && (
                <InlineEditor
                  content=""
                  placeholder="TASK 입력..."
                  onSave={onSaveEdit}
                  onCancel={onCancelEdit}
                  status={editingCell.status}
                  onStatusChange={onStatusChange}
                />
              )}
            </div>
          );
        })}

        {/* Collapsed - empty filler */}
        {!expanded && (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}

/* --- Main Page --- */
export default function WeeklyMeetingPage() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [showExcelDownload, setShowExcelDownload] = useState(false);
  const [showNewAction, setShowNewAction] = useState(false);
  const [showCarryover, setShowCarryover] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());

  const meetingModeActive = useUIStore((s) => s.meetingModeActive);

  const toggleWeek = (key: string) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Weeks in current month
  const weeksInMonth = useMemo(
    () => getWeeksInMonth(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  // Fetch all cycles and find matching ones
  const { data: currentCycleData } = useCurrentCycle();
  const { data: cyclesData } = useWeeklyCycles(viewYear);
  const currentCycle = currentCycleData?.data;
  const allCycles = cyclesData?.data ?? [];

  const monthCycles = useMemo(() => {
    return weeksInMonth.map((w) => {
      const cycle = allCycles.find(
        (c) => c.year === w.year && c.weekNumber === w.weekNumber,
      );
      return { ...w, cycleId: cycle?.id ?? null };
    });
  }, [weeksInMonth, allCycles]);

  const cycleIds = useMemo(
    () => monthCycles.filter((c) => c.cycleId).map((c) => c.cycleId!),
    [monthCycles],
  );

  // Fetch actions for all cycles in the month (single batch request)
  const { data: actionsData, isLoading } = useWeeklyActionsMultiCycle(cycleIds);
  const actions = (actionsData?.data ?? []) as (WeeklyAction & {
    company?: { id: string; canonicalName: string; isKey: boolean };
  })[];

  // For meeting mode - get current cycle's actions
  const activeCycleId = currentCycle?.id ?? null;
  const { data: currentActionsData } = useWeeklyActions({
    cycleId: activeCycleId ?? undefined,
    status: statusFilter || undefined,
  });
  const currentActions = (currentActionsData?.data ?? []) as WeeklyActionWithRelations[];

  // Companies
  const { data: companiesData } = useCompanies();
  const companies = (companiesData?.data ?? []) as Company[];

  // Group actions by company + cycle, with optional status filter
  const { companyRows, actionMap } = useMemo(() => {
    const map = new Map<string, Map<string, (typeof actions)[number][]>>();

    for (const c of companies) {
      map.set(c.id, new Map());
    }

    for (const action of actions) {
      // Apply status filter if set
      if (statusFilter && action.status !== statusFilter) continue;

      if (!map.has(action.companyId)) {
        map.set(action.companyId, new Map());
      }
      const cycleMap = map.get(action.companyId)!;
      if (!cycleMap.has(action.cycleId)) {
        cycleMap.set(action.cycleId, []);
      }
      cycleMap.get(action.cycleId)!.push(action);
    }

    const rows = companies
      .filter((c) => !c.isArchived)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({
        company: c,
        hasAnyAction: actions.some((a) => a.companyId === c.id),
      }));

    return { companyRows: rows, actionMap: map };
  }, [companies, actions, statusFilter]);

  // Navigation
  const goToPrevMonth = () => {
    if (viewMonth === 1) { setViewYear(viewYear - 1); setViewMonth(12); }
    else setViewMonth(viewMonth - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 12) { setViewYear(viewYear + 1); setViewMonth(1); }
    else setViewMonth(viewMonth + 1);
  };

  // Find previous cycle for carryover
  const prevCycle = useMemo(() => {
    if (!currentCycle) return null;
    return allCycles.find(
      (c) =>
        (c.year === currentCycle.year && c.weekNumber === currentCycle.weekNumber - 1) ||
        (currentCycle.weekNumber === 1 && c.year === currentCycle.year - 1 && c.weekNumber >= 52),
    );
  }, [allCycles, currentCycle]);

  const weekLabel = currentCycle
    ? formatWeekLabel(currentCycle.year, currentCycle.weekNumber)
    : "";

  // Inline editing
  const createAction = useCreateWeeklyAction();
  const updateAction = useUpdateWeeklyAction();
  const ensureCycle = useEnsureCycle();
  const [editingCell, setEditingCell] = useState<EditingCell>(null);

  const startEdit = useCallback(async (
    companyId: string,
    cycleId: string | null,
    weekYear: number,
    weekNumber: number,
    action?: WeeklyAction,
  ) => {
    let resolvedCycleId = cycleId;
    if (!resolvedCycleId) {
      const result = await ensureCycle.mutateAsync({ year: weekYear, weekNumber });
      resolvedCycleId = result.data.id;
    }
    setEditingCell({
      companyId,
      cycleId: resolvedCycleId,
      weekYear,
      weekNumber,
      actionId: action?.id,
      status: action?.status ?? "scheduled",
    });
  }, [ensureCycle]);

  const saveEdit = useCallback((html: string) => {
    if (!editingCell) return;

    if (editingCell.actionId) {
      if (html) {
        const action = actions.find((a) => a.id === editingCell.actionId);
        if (action && (html !== action.content || editingCell.status !== action.status)) {
          updateAction.mutate({
            id: editingCell.actionId,
            lockVersion: action.lockVersion,
            content: html,
            status: editingCell.status,
          });
        }
      }
    } else {
      if (html && editingCell.cycleId) {
        createAction.mutate({
          cycleId: editingCell.cycleId,
          companyId: editingCell.companyId,
          content: html,
          status: editingCell.status,
        });
      }
    }
    setEditingCell(null);
  }, [editingCell, actions, createAction, updateAction]);

  const handleActionStatusChange = useCallback((actionId: string, lockVersion: number, newStatus: string) => {
    updateAction.mutate({
      id: actionId,
      lockVersion,
      status: newStatus,
    });
  }, [updateAction]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-3 shrink-0">
        <h1 className="text-lg font-bold">주간회의</h1>

        <MonthPicker
          year={viewYear}
          month={viewMonth}
          onPrev={goToPrevMonth}
          onNext={goToNextMonth}
          onChange={(y, m) => { setViewYear(y); setViewMonth(m); }}
        />

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm outline-none"
        >
          <option value="">전체 상태</option>
          <option value="scheduled">예정</option>
          <option value="in_progress">진행중</option>
          <option value="completed">완료</option>
          <option value="on_hold">보류</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowExcelDownload(true)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)] transition-colors"
          >
            엑셀
          </button>
          <MeetingModeToggle />
          {prevCycle && (
            <WeekEndActions onCarryover={() => setShowCarryover(true)} />
          )}
          <QuickActionsBar
            actions={[
              { label: "액션", onClick: () => setShowNewAction(true) },
            ]}
          />
        </div>
      </div>

      {/* Meeting Mode */}
      {meetingModeActive && (
        <MeetingModeView
          actions={currentActions}
          weekLabel={weekLabel}
        />
      )}

      {/* Table view */}
      <div className={`flex-1 overflow-auto ${meetingModeActive ? "hidden" : ""}`}>
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
          </div>
        )}

        <div className="min-w-full">
          {/* Header */}
          <div className="sticky top-0 z-10 flex border-b border-[var(--border)] bg-[var(--background)]">
            <div className="sticky left-0 z-20 w-[220px] shrink-0 border-r border-[var(--border)] bg-[var(--background)] px-3 py-2">
              <span className="text-sm font-bold text-[var(--muted-foreground)]">
                고객사
              </span>
            </div>
            {monthCycles.map((w) => {
              const wKey = `${w.year}-${w.weekNumber}`;
              const collapsed = collapsedWeeks.has(wKey);
              return (
                <div
                  key={wKey}
                  onClick={() => toggleWeek(wKey)}
                  className={`shrink-0 border-r border-[var(--border)] cursor-pointer select-none transition-all ${
                    collapsed
                      ? "w-[40px] px-1 py-2 bg-[var(--muted)] opacity-40 hover:opacity-70"
                      : "w-[320px] px-3 py-2 hover:bg-[var(--muted)]"
                  }`}
                  title={collapsed ? `${viewMonth}월 ${w.weekInMonth}주 표시` : `${viewMonth}월 ${w.weekInMonth}주 숨기기`}
                >
                  <span
                    className="text-sm font-bold text-[var(--muted-foreground)]"
                    style={collapsed ? { writingMode: "vertical-rl", textOrientation: "mixed" } : undefined}
                  >
                    {viewMonth}월 {w.weekInMonth}주
                  </span>
                </div>
              );
            })}
          </div>

          {/* Company rows */}
          {companyRows.map(({ company }) => {
            const cycleMap = actionMap.get(company.id);

            return (
              <WeeklyCompanyRow
                key={company.id}
                company={company}
                monthCycles={monthCycles}
                cycleMap={cycleMap}
                editingCell={editingCell}
                collapsedWeeks={collapsedWeeks}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditingCell(null)}
                onStatusChange={(status) =>
                  setEditingCell((prev) => prev ? { ...prev, status } : null)
                }
                onActionStatusChange={handleActionStatusChange}
              />
            );
          })}
        </div>
      </div>

      {/* Dialogs */}
      {activeCycleId && (
        <NewActionDialog
          open={showNewAction}
          onClose={() => setShowNewAction(false)}
          cycleId={activeCycleId}
          companies={companies as Company[]}
        />
      )}

      {prevCycle && activeCycleId && currentCycle && (
        <CarryoverDialog
          open={showCarryover}
          onClose={() => setShowCarryover(false)}
          sourceCycleId={prevCycle.id}
          targetCycleId={activeCycleId}
          sourceLabel={formatWeekLabel(prevCycle.year, prevCycle.weekNumber)}
          targetLabel={formatWeekLabel(currentCycle.year, currentCycle.weekNumber)}
        />
      )}

      <ExcelDownloadDialog
        open={showExcelDownload}
        onClose={() => setShowExcelDownload(false)}
        defaultType="weekly"
      />
    </div>
  );
}
