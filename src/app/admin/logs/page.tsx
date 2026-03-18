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
      <h1 className="mb-4 text-lg font-bold">감사 로그</h1>

      <div className="mb-4 flex gap-3">
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="">전체 항목 유형</option>
          <option value="company">기업</option>
          <option value="business">사업</option>
          <option value="progress_item">진행 항목</option>
          <option value="weekly_action">주간 액션</option>
          <option value="internal_note">내부 메모</option>
          <option value="user">사용자</option>
        </select>

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="">전체 작업</option>
          <option value="create">생성</option>
          <option value="update">수정</option>
          <option value="delete">삭제</option>
          <option value="move">이동</option>
          <option value="merge">병합</option>
          <option value="carryover">이월</option>
          <option value="status_change">상태 변경</option>
          <option value="role_change">역할 변경</option>
        </select>
      </div>

      {isLoading && (
        <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
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
          감사 로그를 찾을 수 없습니다.
        </p>
      )}
    </div>
  );
}
