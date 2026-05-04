"use client";

import { useState, useEffect } from "react";
import { fetchJson } from "@/lib/fetch";
import type { User, Role, UserStatus, ApiListResponse } from "@/types";

const roleBadgeClass: Record<Role, string> = {
  admin: "bg-[var(--primary)]/10 text-[var(--primary)]",
  user: "bg-[var(--muted)] text-[var(--muted-foreground)]",
};

const statusBadgeClass: Record<UserStatus, string> = {
  pending: "bg-[var(--priority-medium)]/15 text-[var(--priority-medium)]",
  approved: "bg-[var(--status-completed)]/15 text-[var(--status-completed)]",
  rejected: "bg-[var(--destructive)]/15 text-[var(--destructive)]",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchJson<ApiListResponse<User>>("/api/admin/users");
      setUsers(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUser = async (id: string, data: { role?: Role; status?: UserStatus }) => {
    await fetchJson("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    loadUsers();
  };

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">사용자 관리</h1>

      {loading && (
        <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {user.email ?? "이메일 없음"}
              </p>
            </div>

            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass[user.role]}`}
            >
              {user.role}
            </span>

            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[user.status]}`}
            >
              {user.status}
            </span>

            <div className="flex gap-1">
              {user.status !== "approved" && (
                <button
                  onClick={() => updateUser(user.id, { status: "approved" })}
                  className="rounded-md bg-[var(--status-completed)] px-2 py-1 text-xs text-white hover:opacity-90"
                >
                  승인
                </button>
              )}
              {user.status !== "rejected" && user.status !== "pending" && (
                <button
                  onClick={() => updateUser(user.id, { status: "rejected" })}
                  className="rounded-md bg-[var(--destructive)] px-2 py-1 text-xs text-white hover:opacity-90"
                >
                  거절
                </button>
              )}
              {user.status === "pending" && (
                <button
                  onClick={() => updateUser(user.id, { status: "rejected" })}
                  className="rounded-md bg-[var(--destructive)] px-2 py-1 text-xs text-white hover:opacity-90"
                >
                  거절
                </button>
              )}
              {user.role === "user" && (
                <button
                  onClick={() => updateUser(user.id, { role: "admin" })}
                  className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)]"
                >
                  관리자 지정
                </button>
              )}
              {user.role === "admin" && (
                <button
                  onClick={() => updateUser(user.id, { role: "user" })}
                  className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)]"
                >
                  관리자 해제
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && users.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)]">사용자를 찾을 수 없습니다.</p>
      )}
    </div>
  );
}
