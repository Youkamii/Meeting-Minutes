"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Version, ApiListResponse, ApiResponse } from "@/types";

// TODO: fetchJson is duplicated across 8 hook/page files (use-businesses, use-companies,
// use-progress-items, use-weekly-actions, use-versions, use-activity, admin/merge, admin/users).
// Extract to a shared utility like src/lib/fetch-json.ts to reduce duplication.
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, ...err };
  }
  return res.json();
}

export function useVersions(entityType: string, entityId: string | null) {
  const qs = new URLSearchParams();
  qs.set("entity_type", entityType);
  if (entityId) qs.set("entity_id", entityId);

  return useQuery<ApiListResponse<Version>>({
    queryKey: ["versions", entityType, entityId],
    queryFn: () => fetchJson(`/api/versions?${qs}`),
    enabled: !!entityId,
  });
}

export function useRestoreVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { versionId: string; entityType: string }) =>
      fetchJson<ApiResponse<unknown>>("/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["versions"] });
    },
  });
}
