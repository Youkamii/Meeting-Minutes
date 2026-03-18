"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/use-activity";

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading } = useAuditLogs({
    entityType: entityType || undefined,
    limit: 100,
  });

  const logs = data?.data ?? [];

  const filtered = action
    ? logs.filter((log) => log.action === action)
    : logs;

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">Audit Logs</h1>

      <div className="mb-4 flex gap-3">
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="">All Entity Types</option>
          <option value="company">Company</option>
          <option value="business">Business</option>
          <option value="progress_item">Progress Item</option>
          <option value="weekly_action">Weekly Action</option>
          <option value="internal_note">Internal Note</option>
          <option value="user">User</option>
        </select>

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="move">Move</option>
          <option value="merge">Merge</option>
          <option value="carryover">Carryover</option>
          <option value="status_change">Status Change</option>
          <option value="role_change">Role Change</option>
        </select>
      </div>

      {isLoading && (
        <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
      )}

      <div className="space-y-1">
        {filtered.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium capitalize">{log.action}</span>{" "}
                <span className="text-[var(--muted-foreground)]">
                  {log.entityType}
                </span>
                <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                  {log.entityId.slice(0, 8)}...
                </span>
              </p>
              {log.summary && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {log.summary}
                </p>
              )}
            </div>
            <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
              {new Date(log.createdAt).toLocaleString("ko-KR")}
            </span>
          </div>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)]">
          No audit logs found.
        </p>
      )}
    </div>
  );
}
