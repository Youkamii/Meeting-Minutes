"use client";

import { useSession, signOut } from "next-auth/react";

export default function PendingPage() {
  const { data: session } = useSession();
  const isRejected = session?.user?.status === "rejected";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="mx-4 w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--background)] p-8 shadow-xl text-center">
        {isRejected ? (
          <>
            <h1 className="text-xl font-bold mb-2">접근이 거부되었습니다</h1>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              관리자에 의해 접근이 거부되었습니다. 문의 사항은 관리자에게 연락해주세요.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-2">승인 대기 중</h1>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              관리자의 승인을 기다리고 있습니다. 승인이 완료되면 서비스를 이용할 수 있습니다.
            </p>
          </>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
