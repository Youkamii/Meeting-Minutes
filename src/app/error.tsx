"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <h2 className="text-xl font-bold mb-2">오류가 발생했습니다</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-md">
        {error.digest
          ? "알 수 없는 오류가 발생했습니다."
          : error.message || "알 수 없는 오류가 발생했습니다."}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
      >
        다시 시도
      </button>
    </div>
  );
}
