"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WeeklyAction, WeeklyCycle, ApiListResponse } from "@/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, ...err };
  }
  return res.json();
}

// Weekly Cycles
export function useCurrentCycle() {
  return useQuery<{ data: WeeklyCycle }>({
    queryKey: ["currentCycle"],
    queryFn: () => fetchJson("/api/weekly-cycles?current=true"),
  });
}

export function useWeeklyCycles(year?: number) {
  const qs = year ? `?year=${year}` : "";
  return useQuery<{ data: WeeklyCycle[] }>({
    queryKey: ["weeklyCycles", year],
    queryFn: () => fetchJson(`/api/weekly-cycles${qs}`),
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

// Ensure a cycle exists (create if needed), returns cycle id
export function useEnsureCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { year: number; weekNumber: number }) =>
      fetchJson<{ data: WeeklyCycle }>(`/api/weekly-cycles?current=false&year=${data.year}&week_number=${data.weekNumber}&ensure=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weeklyCycles"] });
    },
  });
}

// Fetch actions for multiple cycles at once (for monthly view)
export function useWeeklyActionsMultiCycle(cycleIds: string[]) {
  return useQuery<ApiListResponse<WeeklyAction>>({
    queryKey: ["weeklyActions", "multi", cycleIds],
    queryFn: async () => {
      if (cycleIds.length === 0) return { data: [], total: 0 };
      const results = await Promise.all(
        cycleIds.map((id) =>
          fetchJson<ApiListResponse<WeeklyAction>>(`/api/weekly-actions?cycle_id=${id}`),
        ),
      );
      const allActions = results.flatMap((r) => r.data);
      return { data: allActions, total: allActions.length };
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
