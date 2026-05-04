"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchJson } from "@/lib/fetch";

function UnlockForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/admin/users";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await fetchJson("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "잘못된 비밀번호");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-20 max-w-sm space-y-3 rounded-md border border-[var(--border)] bg-[var(--card)] p-6"
    >
      <h1 className="text-lg font-bold">관리자 모드</h1>
      <p className="text-xs text-[var(--muted-foreground)]">
        관리자 기능에 접근하려면 비밀번호를 입력하세요.
      </p>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] disabled:opacity-50"
      >
        {loading ? "확인 중..." : "들어가기"}
      </button>
    </form>
  );
}

export default function AdminUnlockPage() {
  return (
    <Suspense>
      <UnlockForm />
    </Suspense>
  );
}
