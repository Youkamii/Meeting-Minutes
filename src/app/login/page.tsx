"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("비밀번호가 올바르지 않습니다");
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="mx-4 w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--background)] p-8 shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-2">회의록</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-8">
          사업관리 & 주간회의 운영 시스템
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-3 rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 로그인
        </button>

        {!showPassword ? (
          <button
            onClick={() => setShowPassword(true)}
            className="w-full mt-3 flex items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            비밀번호로 로그인
          </button>
        ) : (
          <form onSubmit={handlePasswordLogin} className="mt-3 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              autoFocus
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        )}

        <a
          href="/"
          className="block mt-4 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          이미 로그인했다면 여기를 클릭
        </a>
      </div>
    </div>
  );
}
