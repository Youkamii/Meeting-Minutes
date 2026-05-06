"use client";

import { useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/fetch";
import { useVersionUnlockStore } from "@/stores/version-unlock-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function VersionUnlockModal({ open, onClose }: Props) {
  const setUnlocked = useVersionUnlockStore((s) => s.setUnlocked);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await fetchJson("/api/admin/version-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      setUnlocked(true);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "잘못된 비밀번호");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 elevation-modal"
      >
        <h2 className="text-base font-semibold">버전 관리 잠금 해제</h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          버전 비교/복원 기능을 사용하려면 비밀번호를 입력하세요.
        </p>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          placeholder="비밀번호"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--muted)]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading || !password}
            className="flex-1 rounded-md bg-[var(--primary)] px-3 py-2 text-xs text-[var(--primary-foreground)] disabled:opacity-50"
          >
            {loading ? "확인 중..." : "확인"}
          </button>
        </div>
      </form>
    </div>
  );
}
