"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { AuditLog, RecentView, ApiListResponse } from "@/types";

export function useAuditLogs(params?: {
  entityType?: string;
  entityId?: string;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.entityType) qs.set("entity_type", params.entityType);
  if (params?.entityId) qs.set("entity_id", params.entityId);
  if (params?.limit) qs.set("limit", String(params.limit));

  return useQuery<ApiListResponse<AuditLog>>({
    queryKey: ["auditLogs", params],
    queryFn: () => fetchJson(`/api/audit-logs?${qs}`),
  });
}

export function useRecentViews(limit = 20) {
  return useQuery<{ data: RecentView[] }>({
    queryKey: ["recentViews", limit],
    queryFn: () => fetchJson(`/api/recent-views?limit=${limit}`),
  });
}
