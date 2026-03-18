"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProgressItem, Stage } from "@/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }
    throw new Error(parsed.message || `HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export function useProgressItems(businessId: string | null) {
  return useQuery<{ data: Record<Stage, ProgressItem[]> }>({
    queryKey: ["progressItems", businessId],
    queryFn: () =>
      fetchJson(`/api/businesses/${businessId}/progress-items`),
    enabled: !!businessId,
  });
}

export function useCreateProgressItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      businessId: string;
      stage: Stage;
      title?: string;
      content?: string;
      date?: string;
    }) =>
      fetchJson(`/api/businesses/${data.businessId}/progress-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: data.stage,
          title: data.title,
          content: data.content,
          date: data.date,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progressItems"] });
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}

export function useUpdateProgressItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      title?: string;
      content?: string;
      date?: string | null;
      sortOrder?: number;
      lockVersion?: number; // ignored now, kept for interface compat
    }) =>
      fetchJson(`/api/progress-items/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          date: data.date,
          sortOrder: data.sortOrder,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progressItems"] });
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}

export function useMoveProgressItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      targetStage: Stage;
      sortOrder?: number;
      lockVersion?: number; // ignored now
    }) =>
      fetchJson(`/api/progress-items/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          targetStage: data.targetStage,
          sortOrder: data.sortOrder,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progressItems"] });
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}

export function useDeleteProgressItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, lockVersion }: { id: string; lockVersion: number }) => {
      const res = await fetch(`/api/progress-items/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockVersion }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw { status: res.status, ...err };
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progressItems"] });
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}
