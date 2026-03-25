"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { SearchOverlay } from "@/components/search/search-overlay";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="rounded-md px-3 py-2 text-base font-medium hover:bg-[var(--accent)] transition-colors"
    >
      {children}
    </a>
  );
}

export function TopNav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const userRole = session?.user?.role;

  useEffect(() => setMounted(true), []);

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]">
        <nav className="flex h-14 items-center gap-2 px-6">
          <a href="/" className="mr-4 text-lg font-bold">
            MM
          </a>

          <NavLink href="/">홈</NavLink>
          <NavLink href="/business">사업관리</NavLink>
          <NavLink href="/weekly">주간회의</NavLink>
          {userRole === "admin" && <NavLink href="/admin">관리자</NavLink>}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-8 w-56 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--muted-foreground)] sm:flex"
            >
              <span>🔍</span>
              <span className="flex-1 text-left">검색...</span>
              <kbd className="rounded border border-[var(--border)] px-1 py-0.5 text-[10px]">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] sm:hidden"
            >
              🔍
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 rounded-md border border-[var(--border)] text-sm hover:bg-[var(--accent)] transition-colors"
              aria-label="테마 전환"
            >
              {mounted ? (theme === "dark" ? "☀" : "☽") : "◑"}
            </button>

            {session?.user ? (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="h-8 rounded-md border border-[var(--border)] px-2 text-xs hover:bg-[var(--muted)] transition-colors flex items-center gap-1.5"
                title="로그아웃"
              >
                {session.user.image ? (
                  <img src={session.user.image} alt="" className="h-5 w-5 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-[10px]">
                    {session.user.name?.charAt(0) ?? "U"}
                  </div>
                )}
                <span className="hidden sm:inline">{session.user.name}</span>
              </button>
            ) : (
              <a
                href="/login"
                className="h-8 rounded-md border border-[var(--border)] px-3 text-xs hover:bg-[var(--muted)] transition-colors flex items-center"
              >
                로그인
              </a>
            )}
          </div>
        </nav>
      </header>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
