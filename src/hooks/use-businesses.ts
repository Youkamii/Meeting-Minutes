"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { Business, ApiListResponse, ApiResponse } from "@/types";

export function useBusinesses(params?: {
  companyId?: string;
  search?: string;
  includeArchived?: boolean;
}) {
  const qs = new URLSearchParams();
  if (params?.companyId) qs.set("company_id", params.companyId);
  if (params?.search) qs.set("search", params.search);
  if (params?.includeArchived) qs.set("include_archived", "true");

  return useQuery<ApiListResponse<Business>>({
    queryKey: ["businesses", params],
    queryFn: () => fetchJson(`/api/businesses?${qs}`),
  });
}

export function useBusiness(id: string | null) {
  return useQuery<ApiResponse<Business>>({
    queryKey: ["business", id],
    queryFn: () => fetchJson(`/api/businesses/${id}`),
    enabled: !!id,
  });
}

export function useCreateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      companyId: string;
      name: string;
      visibility?: string;
      scale?: string;
      timingText?: string;
      timingStart?: string;
      timingEnd?: string;
      assignedTo?: string;
    }) =>
      fetchJson<ApiResponse<Business>>("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}

export function useUpdateBusiness() {
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
      fetchJson<ApiResponse<Business>>(`/api/businesses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["businesses"] });
      qc.invalidateQueries({ queryKey: ["business"] });
    },
  });
}

export function useArchiveBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "archive" | "restore" }) =>
      fetchJson<ApiResponse<Business>>(`/api/businesses/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}
