"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/logs", label: "감사 로그" },
  { href: "/admin/checkpoints", label: "체크포인트" },
  { href: "/admin/settings", label: "설정" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [locking, setLocking] = useState(false);

  const lockAdmin = async () => {
    setLocking(true);
    try {
      await fetch("/api/admin/unlock", { method: "DELETE" });
      router.replace("/");
      router.refresh();
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          관리자
        </h2>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                pathname === item.href
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "hover:bg-[var(--muted)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={lockAdmin}
          disabled={locking}
          className="mt-auto rounded-md border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-red-600 disabled:opacity-50"
        >
          {locking ? "종료 중..." : "관리자 모드 종료"}
        </button>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
