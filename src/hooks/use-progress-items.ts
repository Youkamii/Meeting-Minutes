"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { ProgressItem, Stage } from "@/types";

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
      lockVersion?: number;
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
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["businesses"] });
      const prev = qc.getQueriesData({ queryKey: ["businesses"] });

      qc.setQueriesData({ queryKey: ["businesses"] }, (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old)) return old;
        const cast = old as { data: Array<{ progressItems?: ProgressItem[]; [k: string]: unknown }>; [k: string]: unknown };
        return {
          ...cast,
          data: cast.data.map((biz) => {
            const items = biz.progressItems;
            if (!items || !items.some((p) => p.id === data.id)) return biz;

            const moved = items.find((p) => p.id === data.id)!;
            const rest = items.filter((p) => p.id !== data.id);
            const updated = { ...moved, stage: data.targetStage, sortOrder: data.sortOrder ?? 0 };
            const newItems = [...rest, updated].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            return { ...biz, progressItems: newItems };
          }),
        };
      });

      return { prev };
    },
    onError: (_err, _data, context) => {
      if (context?.prev) {
        for (const [key, value] of context.prev) {
          qc.setQueryData(key, value);
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["progressItems"] });
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}

export function useDeleteProgressItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lockVersion }: { id: string; lockVersion: number }) =>
      fetchJson(`/api/progress-items/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockVersion }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progressItems"] });
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}
