"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { Version, ApiListResponse, ApiResponse } from "@/types";

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
