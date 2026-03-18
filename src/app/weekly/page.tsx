"use client";

import { useState, useMemo } from "react";
import { useCurrentCycle, useWeeklyCycles, useWeeklyActions } from "@/hooks/use-weekly-actions";
import { useCompanies } from "@/hooks/use-companies";
import { ActionCard } from "@/components/weekly-meeting/action-card";
import { NewActionDialog } from "@/components/weekly-meeting/new-action-dialog";
import { CarryoverDialog } from "@/components/weekly-meeting/carryover-dialog";
import { WeekEndActions } from "@/components/weekly-meeting/week-end-actions";
import { QuickActionsBar } from "@/components/ui/quick-actions";
import { MeetingModeToggle } from "@/components/meeting-mode/meeting-mode-toggle";
import { MeetingModeView } from "@/components/meeting-mode/meeting-mode-view";
import { useUIStore } from "@/stores/ui-store";
import { ExcelDownloadDialog } from "@/components/export/excel-download-dialog";
import { formatWeekLabel } from "@/lib/weekly-cycle";
import type { Company, ActionStatus, Priority } from "@/types";

export default function WeeklyMeetingPage() {
  const { data: currentCycleData } = useCurrentCycle();
  const { data: cyclesData } = useWeeklyCycles();
  const currentCycle = currentCycleData?.data;
  const cycles = cyclesData?.data ?? [];

  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const activeCycleId = selectedCycleId ?? currentCycle?.id ?? null;

  const meetingModeActive = useUIStore((s) => s.meetingModeActive);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showNewAction, setShowNewAction] = useState(false);
  const [showCarryover, setShowCarryover] = useState(false);
  const [showExcelDownload, setShowExcelDownload] = useState(false);

  const { data: actionsData, isLoading: actionsLoading } = useWeeklyActions({
    cycleId: activeCycleId ?? undefined,
    status: statusFilter || undefined,
  });
  const { data: companiesData } = useCompanies();

  const actions = actionsData?.data ?? [];
  const companies = companiesData?.data ?? [];

  // Group actions by company — include ALL companies from Business Management
  const groupedActions = useMemo(() => {
    const groups: Record<
      string,
      {
        company: { id: string; canonicalName: string; isKey: boolean };
        actions: typeof actions;
      }
    > = {};

    // First, add all companies from Business Management
    for (const company of companies) {
      const c = company as unknown as { id: string; canonicalName: string; isKey: boolean };
      groups[c.id] = {
        company: c,
        actions: [],
      };
    }

    // Then, assign actions to their companies
    for (const action of actions) {
      const a = action as unknown as {
        companyId: string;
        company?: { id: string; canonicalName: string; isKey: boolean };
      };
      const companyId = a.companyId;
      if (!groups[companyId]) {
        groups[companyId] = {
          company: a.company ?? {
            id: companyId,
            canonicalName: "Unknown",
            isKey: false,
          },
          actions: [],
        };
      }
      groups[companyId].actions.push(action);
    }

    return Object.values(groups).sort((a, b) => {
      if (a.company.isKey !== b.company.isKey) return a.company.isKey ? -1 : 1;
      return a.company.canonicalName.localeCompare(b.company.canonicalName);
    });
  }, [actions, companies]);

  const activeCycle = cycles.find((c) => c.id === activeCycleId) ?? currentCycle;
  const weekLabel = activeCycle
    ? formatWeekLabel(activeCycle.year, activeCycle.weekNumber)
    : "";

  // Find previous cycle for carryover
  const prevCycle = useMemo(() => {
    if (!activeCycle) return null;
    return cycles.find(
      (c) =>
        c.year === activeCycle.year && c.weekNumber === activeCycle.weekNumber - 1 ||
        (activeCycle.weekNumber === 1 && c.year === activeCycle.year - 1),
    );
  }, [cycles, activeCycle]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        <h1 className="text-lg font-bold">주간회의</h1>

        {/* Week selector */}
        <select
          value={activeCycleId ?? ""}
          onChange={(e) => setSelectedCycleId(e.target.value || null)}
          className="h-8 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          {currentCycle && (
            <option value={currentCycle.id}>
              {formatWeekLabel(currentCycle.year, currentCycle.weekNumber)} (현재)
            </option>
          )}
          {cycles
            .filter((c) => c.id !== currentCycle?.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {formatWeekLabel(c.year, c.weekNumber)}
              </option>
            ))}
        </select>

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
          actions={actions as never[]}
          weekLabel={weekLabel}
        />
      )}

      {/* Normal Action list */}
      <div className={`flex-1 overflow-y-auto p-4 ${meetingModeActive ? "hidden" : ""}`}>
        {actionsLoading && (
          <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
        )}

        {!actionsLoading && groupedActions.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <p className="text-lg font-medium">이번 주 액션이 없습니다</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              첫 번째 주간 액션을 생성하거나 지난 주에서 이월하세요.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowNewAction(true)}
                className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90"
              >
                + 새 액션
              </button>
              {prevCycle && (
                <button
                  onClick={() => setShowCarryover(true)}
                  className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)]"
                >
                  ↻ 이월
                </button>
              )}
            </div>
          </div>
        )}

        {groupedActions.map(({ company, actions: companyActions }) => (
          <div key={company.id} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {company.isKey && (
                <span className="text-yellow-500 text-sm">★</span>
              )}
              <h2 className="text-sm font-bold">{company.canonicalName}</h2>
              <span className="text-xs text-[var(--muted-foreground)]">
                {companyActions.length}개 액션
              </span>
            </div>

            <div className="space-y-2 pl-4">
              {companyActions.length === 0 && (
                <p className="text-xs text-[var(--muted-foreground)] py-2">
                  이번 주 액션이 없습니다.{" "}
                  <button
                    onClick={() => setShowNewAction(true)}
                    className="text-[var(--primary)] hover:underline"
                  >
                    추가하기
                  </button>
                </p>
              )}
              {companyActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={
                    action as unknown as {
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
                    }
                  }
                />
              ))}
            </div>
          </div>
        ))}
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

      {prevCycle && activeCycleId && activeCycle && (
        <CarryoverDialog
          open={showCarryover}
          onClose={() => setShowCarryover(false)}
          sourceCycleId={prevCycle.id}
          targetCycleId={activeCycleId}
          sourceLabel={formatWeekLabel(prevCycle.year, prevCycle.weekNumber)}
          targetLabel={formatWeekLabel(activeCycle.year, activeCycle.weekNumber)}
        />
      )}

      <ExcelDownloadDialog
        open={showExcelDownload}
        onClose={() => setShowExcelDownload(false)}
        defaultType="weekly"
        cycleId={activeCycleId ?? undefined}
      />
    </div>
  );
}
