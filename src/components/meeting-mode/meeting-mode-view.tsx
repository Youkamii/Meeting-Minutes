"use client";

import { useMemo } from "react";
import { MeetingActionCard } from "./meeting-action-card";
import type { ActionStatus, Priority } from "@/types";

interface MeetingAction {
  id: string;
  content: string;
  status: ActionStatus;
  priority: Priority;
  carryoverCount: number;
  lockVersion: number;
  companyId: string;
  company?: { id: string; canonicalName: string; isKey: boolean };
  business?: { name: string } | null;
}

interface MeetingModeViewProps {
  actions: MeetingAction[];
  weekLabel: string;
}

export function MeetingModeView({ actions, weekLabel }: MeetingModeViewProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, { company: MeetingAction["company"]; actions: MeetingAction[] }> = {};

    for (const action of actions) {
      const cid = action.companyId;
      if (!groups[cid]) {
        groups[cid] = { company: action.company, actions: [] };
      }
      groups[cid].actions.push(action);
    }

    return Object.values(groups).sort((a, b) => {
      if (a.company?.isKey !== b.company?.isKey) return a.company?.isKey ? -1 : 1;
      return (a.company?.canonicalName ?? "").localeCompare(b.company?.canonicalName ?? "");
    });
  }, [actions]);

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-1">Weekly Meeting</h1>
        <p className="text-xl text-[var(--muted-foreground)] mb-8">{weekLabel}</p>

        {grouped.map(({ company, actions: companyActions }) => (
          <div key={company?.id ?? "unknown"} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              {company?.isKey && <span className="text-2xl text-yellow-500">★</span>}
              <h2 className="text-2xl font-bold">{company?.canonicalName ?? "Unknown"}</h2>
            </div>

            <div className="space-y-3">
              {companyActions.map((action) => (
                <MeetingActionCard key={action.id} action={action} />
              ))}
            </div>
          </div>
        ))}

        {actions.length === 0 && (
          <p className="text-xl text-center text-[var(--muted-foreground)] py-16">
            No actions for this week.
          </p>
        )}
      </div>
    </div>
  );
}
