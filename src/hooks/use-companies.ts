"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Company, ApiListResponse, ApiResponse } from "@/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, ...err };
  }
  return res.json();
}

export function useCompanies(params?: {
  search?: string;
  isKey?: boolean;
  includeArchived?: boolean;
}) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.isKey !== undefined) qs.set("is_key", String(params.isKey));
  if (params?.includeArchived) qs.set("include_archived", "true");

  return useQuery<ApiListResponse<Company>>({
    queryKey: ["companies", params],
    queryFn: () => fetchJson(`/api/companies?${qs}`),
  });
}

export function useCompany(id: string | null) {
  return useQuery<ApiResponse<Company>>({
    queryKey: ["company", id],
    queryFn: () => fetchJson(`/api/companies/${id}`),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      canonicalName: string;
      aliases?: string[];
      isKey?: boolean;
    }) =>
      fetchJson<ApiResponse<Company>>("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      canonicalName?: string;
      isKey?: boolean;
      aliases?: string[];
      lockVersion: number;
    }) =>
      fetchJson<ApiResponse<Company>>(`/api/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["company"] });
    },
  });
}

export function useArchiveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "archive" | "restore" }) =>
      fetchJson<ApiResponse<Company>>(`/api/companies/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
