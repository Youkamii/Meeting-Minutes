"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProgressItem, Stage } from "@/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, ...err };
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
    mutationFn: ({
      businessId,
      stage,
      title,
      content,
      date,
    }: {
      businessId: string;
      stage: Stage;
      title?: string;
      content?: string;
      date?: string;
    }) =>
      fetchJson(`/api/businesses/${businessId}/progress-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, title, content, date }),
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
    mutationFn: ({
      id,
      targetStage,
      sortOrder,
      lockVersion,
    }: {
      id: string;
      targetStage: Stage;
      sortOrder?: number;
      lockVersion: number;
    }) =>
      fetchJson(`/api/progress-items/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", targetStage, sortOrder, lockVersion }),
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
    mutationFn: ({
      id,
      title,
      content,
      date,
      sortOrder,
      lockVersion,
    }: {
      id: string;
      title?: string;
      content?: string;
      date?: string | null;
      sortOrder?: number;
      lockVersion: number;
    }) =>
      fetchJson(`/api/progress-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, date, sortOrder, lockVersion }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progressItems"] });
    },
  });
}

export function useDeleteProgressItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/progress-items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progressItems"] });
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}
