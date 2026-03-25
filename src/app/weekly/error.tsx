"use client";

import { useEffect } from "react";

export default function WeeklyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Weekly page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <h2 className="text-xl font-bold mb-2">주간회의 로드 오류</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-md">
        {error.message || "주간회의 페이지를 불러오는 중 오류가 발생했습니다."}
      </p>
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}
