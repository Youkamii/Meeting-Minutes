"use client";

import { useCompanies } from "@/hooks/use-companies";
import { useCurrentCycle, useWeeklyActions } from "@/hooks/use-weekly-actions";
import { KeyCompaniesCard } from "@/components/home/key-companies-card";
import { IncompleteActionsCard } from "@/components/home/incomplete-actions-card";
import { ActivityFeed } from "@/components/home/activity-feed";
import { formatWeekLabel } from "@/lib/weekly-cycle";
import type { Company, ActionStatus } from "@/types";

export default function HomePage() {
  const { data: companiesData } = useCompanies();
  const { data: cycleData } = useCurrentCycle();
  const currentCycle = cycleData?.data;

  const { data: actionsData } = useWeeklyActions({
    cycleId: currentCycle?.id,
  });

  const companies = (companiesData?.data ?? []) as Company[];
  const actions = (actionsData?.data ?? []) as Array<{
    id: string;
    content: string;
    status: ActionStatus;
    carryoverCount: number;
    company?: { canonicalName: string };
  }>;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">홈</h1>
        {currentCycle && (
          <p className="text-sm text-[var(--muted-foreground)]">
            {formatWeekLabel(currentCycle.year, currentCycle.weekNumber)}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <KeyCompaniesCard companies={companies} />
        </div>

        <div className="lg:col-span-1">
          <IncompleteActionsCard actions={actions} />
        </div>

        <div className="lg:col-span-1 md:col-span-2 lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
