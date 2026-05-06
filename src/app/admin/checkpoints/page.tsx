"use client";

import { useState, useEffect } from "react";
import { fetchJson } from "@/lib/fetch";

type TimelineEntry =
  | {
      type: "checkpoint";
      at: string;
      id: string;
      kind: "weekly" | "pre_restore";
      label: string | null;
      year: number | null;
      weekNumber: number | null;
      byteSize: number | null;
      expiresAt: string | null;
      createdById: string | null;
      auditCountSincePrev: number;
    }
  | {
      type: "restore";
      at: string;
      id: string;
      restoredCheckpointId: string;
      restoredCheckpointLabel: string | null;
      actorId: string | null;
    };

interface TableDiff {
  willDelete: number;
  willInsert: number;
  willUpdate: number;
}

interface CheckpointDiffResponse {
  data: {
    checkpointId: string;
    takenAt: string;
    diff: Record<string, TableDiff>;
  };
}

const TABLE_LABELS: Record<string, string> = {
  companies: "기업",
  companyAliases: "기업 별칭",
  businesses: "사업",
  progressItems: "진행 항목",
  weeklyCycles: "주간 사이클",
  weeklyActions: "주간 액션",
  internalNotes: "내부 메모",
};

function formatBytes(n: number | null): string {
  if (n == null) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(s: string | null): string {
  if (!s) return "-";
  return new Date(s).toLocaleString("ko-KR");
}

export default function CheckpointsPage() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [diffFor, setDiffFor] = useState<string | null>(null);
  const [diff, setDiff] = useState<Record<string, TableDiff> | null>(null);
  const [restoreFor, setRestoreFor] = useState<
    Extract<TimelineEntry, { type: "checkpoint" }> | null
  >(null);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchJson<{ data: TimelineEntry[] }>(
        "/api/admin/checkpoints/timeline",
      );
      setEntries(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createCheckpoint = async () => {
    setCreating(true);
    setMessage(null);
    try {
      await fetchJson("/api/admin/checkpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || null }),
      });
      setLabel("");
      setMessage("스냅샷이 생성되었습니다.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setCreating(false);
    }
  };

  const loadDiff = async (id: string) => {
    setDiffFor(id);
    setDiff(null);
    try {
      const res = await fetchJson<CheckpointDiffResponse>(
        `/api/admin/checkpoints/${id}/diff`,
      );
      setDiff(res.data.diff);
    } catch {
      setDiff(null);
    }
  };

  const doRestore = async () => {
    if (!restoreFor) return;
    setRestoring(true);
    setMessage(null);
    try {
      await fetchJson(`/api/admin/checkpoints/${restoreFor.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText, password }),
      });
      setMessage(
        "복원 완료. 복원 직전 상태는 pre_restore 체크포인트로 7일간 보관됩니다.",
      );
      setRestoreFor(null);
      setConfirmText("");
      setPassword("");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "복원 실패");
    } finally {
      setRestoring(false);
    }
  };

  // A restore event (desc order) means the entries AFTER it in the array
  // (= older) are part of an "abandoned branch" visually.
  let passedRestore = false;

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">체크포인트</h1>

      <div className="mb-4 rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-2 text-sm font-semibold">새 스냅샷 생성</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="라벨 (선택, 예: 2026-W17)"
            className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
          <button
            onClick={createCheckpoint}
            disabled={creating}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] disabled:opacity-50"
          >
            {creating ? "생성 중..." : "스냅샷 생성"}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm">
          {message}
        </div>
      )}

      {loading && (
        <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
      )}

      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-[var(--border)]" />
        {entries.map((e) => {
          if (e.type === "restore") {
            const marker = (
              <div key={e.id} className="relative py-3">
                <div className="absolute -left-[18px] top-4 flex h-4 w-4 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-100 text-[10px] text-amber-700">
                  ⟲
                </div>
                <div className="text-sm text-amber-700">
                  복원됨 →{" "}
                  <strong>
                    {e.restoredCheckpointLabel ?? e.restoredCheckpointId.slice(0, 8)}
                  </strong>{" "}
                  <span className="text-xs text-[var(--muted-foreground)]">
                    ({formatDate(e.at)})
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  이 아래(더 과거) 항목들은 이전 가지입니다.
                </p>
              </div>
            );
            passedRestore = true;
            return marker;
          }

          const isPreRestore = e.kind === "pre_restore";
          const dimmed = passedRestore;

          return (
            <div
              key={e.id}
              className={`relative py-3 ${dimmed ? "opacity-60" : ""}`}
            >
              <div
                className={`absolute -left-[18px] top-4 h-4 w-4 rounded-full border-2 ${
                  isPreRestore
                    ? "border-amber-500 bg-amber-200"
                    : "border-blue-500 bg-blue-200"
                }`}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isPreRestore
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {e.kind}
                    </span>
                    <span className="text-sm font-medium">
                      {e.label ?? e.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(e.at)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-[var(--muted-foreground)]">
                    <span>크기 {formatBytes(e.byteSize)}</span>
                    {e.expiresAt && (
                      <span>만료 {formatDate(e.expiresAt)}</span>
                    )}
                    <span>
                      이 이후 변경{" "}
                      <strong className="text-[var(--foreground)]">
                        {e.auditCountSincePrev}
                      </strong>
                      건
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => loadDiff(e.id)}
                    className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)]"
                  >
                    diff
                  </button>
                  <button
                    onClick={() => setRestoreFor(e)}
                    className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                  >
                    복원
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {!loading && entries.length === 0 && (
          <p className="py-4 text-sm text-[var(--muted-foreground)]">
            체크포인트가 없습니다.
          </p>
        )}
      </div>

      {diffFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setDiffFor(null);
            setDiff(null);
          }}
        >
          <div
            className="max-h-[80vh] w-[90vw] max-w-xl overflow-auto rounded-md border border-[var(--border)] bg-[var(--card)] p-4"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h3 className="mb-3 text-base font-bold">복원 시 변화 (diff)</h3>
            {!diff && (
              <p className="text-sm text-[var(--muted-foreground)]">
                계산 중...
              </p>
            )}
            {diff && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted-foreground)]">
                    <th className="py-2">테이블</th>
                    <th className="py-2 text-right">추가</th>
                    <th className="py-2 text-right">변경</th>
                    <th className="py-2 text-right">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(diff).map(([table, d]) => (
                    <tr key={table} className="border-b border-[var(--border)]">
                      <td className="py-2">{TABLE_LABELS[table] ?? table}</td>
                      <td className="py-2 text-right text-green-600">
                        +{d.willInsert}
                      </td>
                      <td className="py-2 text-right text-amber-600">
                        ~{d.willUpdate}
                      </td>
                      <td className="py-2 text-right text-red-600">
                        -{d.willDelete}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setDiffFor(null);
                  setDiff(null);
                }}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {restoreFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setRestoreFor(null)}
        >
          <div
            className="w-[90vw] max-w-md rounded-md border border-[var(--border)] bg-[var(--card)] p-4"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h3 className="mb-2 text-base font-bold text-red-600">
              체크포인트로 복원
            </h3>
            <p className="mb-3 text-sm">
              <strong>{restoreFor.label ?? restoreFor.id}</strong> (
              {formatDate(restoreFor.at)})
            </p>
            <p className="mb-3 text-xs text-red-600">
              대상 테이블이 모두 TRUNCATE 후 스냅샷 기준으로 재구성됩니다. 이
              시점 이후의 모든 변경은 사라집니다. 복원 직전 상태는 자동으로
              pre_restore 스냅샷에 7일간 보관됩니다.
            </p>

            <label className="mb-2 block text-xs text-[var(--muted-foreground)]">
              확인을 위해 <code>RESTORE</code>를 입력하세요.
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mb-3 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />

            <label className="mb-2 block text-xs text-[var(--muted-foreground)]">
              공유 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRestoreFor(null)}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)]"
              >
                취소
              </button>
              <button
                onClick={doRestore}
                disabled={restoring || confirmText !== "RESTORE" || !password}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {restoring ? "복원 중..." : "복원 실행"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
