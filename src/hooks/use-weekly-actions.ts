"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { WeeklyAction, WeeklyCycle, ApiListResponse } from "@/types";

// Weekly Cycles
export function useCurrentCycle() {
  return useQuery<{ data: WeeklyCycle }>({
    queryKey: ["currentCycle"],
    queryFn: () => fetchJson("/api/weekly-cycles?current=true"),
  });
}

export function useWeeklyCycles(year?: number) {
  return useQuery<{ data: WeeklyCycle[] }>({
    queryKey: ["weeklyCycles", year],
    queryFn: () => fetchJson(`/api/weekly-cycles?year=${year}`),
    enabled: year !== undefined,
  });
}

// Weekly Actions
export function useWeeklyActions(params?: {
  cycleId?: string;
  companyId?: string;
  status?: string;
  search?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.cycleId) qs.set("cycle_id", params.cycleId);
  if (params?.companyId) qs.set("company_id", params.companyId);
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);

  return useQuery<ApiListResponse<WeeklyAction>>({
    queryKey: ["weeklyActions", params],
    queryFn: () => fetchJson(`/api/weekly-actions?${qs}`),
    enabled: !!params?.cycleId,
  });
}

export function useCreateWeeklyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      cycleId: string;
      companyId: string;
      businessId?: string;
      content: string;
      assignedTo?: string;
      status?: string;
      priority?: string;
    }) =>
      fetchJson("/api/weekly-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weeklyActions"] });
    },
  });
}

export function useUpdateWeeklyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      lockVersion: number;
      [key: string]: unknown;
    }) =>
      fetchJson(`/api/weekly-actions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weeklyActions"] });
    },
  });
}

export function useArchiveWeeklyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "archive" | "restore" }) =>
      fetchJson(`/api/weekly-actions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weeklyActions"] });
    },
  });
}

// Ensure a cycle exists (create if needed via POST), returns cycle
export function useEnsureCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { year: number; weekNumber: number }) =>
      fetchJson<{ data: WeeklyCycle }>("/api/weekly-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weeklyCycles"] });
    },
  });
}

// Fetch actions for multiple cycles in a SINGLE request (batch API)
export function useWeeklyActionsMultiCycle(cycleIds: string[]) {
  const ids = cycleIds.join(",");
  return useQuery<ApiListResponse<WeeklyAction>>({
    queryKey: ["weeklyActions", "multi", cycleIds],
    queryFn: () => {
      if (cycleIds.length === 0) return Promise.resolve({ data: [], total: 0 });
      return fetchJson<ApiListResponse<WeeklyAction>>(
        `/api/weekly-actions?cycle_ids=${encodeURIComponent(ids)}`,
      );
    },
    enabled: cycleIds.length > 0,
  });
}

// Carryover
export function useCarryoverCandidates(sourceCycleId: string | null) {
  return useQuery<{ data: WeeklyAction[] }>({
    queryKey: ["carryoverCandidates", sourceCycleId],
    queryFn: () =>
      fetchJson(`/api/weekly-actions/carryover?source_cycle_id=${sourceCycleId}`),
    enabled: !!sourceCycleId,
  });
}

export function useCarryover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      sourceCycleId: string;
      targetCycleId: string;
      actionIds: string[];
    }) =>
      fetchJson("/api/weekly-actions/carryover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weeklyActions"] });
      qc.invalidateQueries({ queryKey: ["carryoverCandidates"] });
    },
  });
}
