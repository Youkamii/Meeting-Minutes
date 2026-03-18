import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meeting Minutes - Business & Weekly Meeting Ops",
  description:
    "Internal operations tool for business management and weekly meeting tracking",
};

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
      className="rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--accent)] transition-colors"
    >
      {children}
    </a>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]">
      <nav className="mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-4">
        <a href="/" className="mr-4 text-lg font-bold">
          MM
        </a>

        <NavLink href="/">Home</NavLink>
        <NavLink href="/business">Business</NavLink>
        <NavLink href="/weekly">Weekly</NavLink>

        <div className="ml-auto flex items-center gap-2">
          {/* Global search placeholder */}
          <div className="hidden sm:block">
            <input
              type="search"
              placeholder="Search... (Ctrl+K)"
              className="h-8 w-56 rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              readOnly
            />
          </div>

          {/* Dark mode toggle placeholder */}
          <button
            className="h-8 w-8 rounded-md border border-[var(--border)] text-sm hover:bg-[var(--accent)] transition-colors"
            aria-label="Toggle theme"
          >
            ◑
          </button>

          {/* User area placeholder */}
          <div className="h-8 w-8 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs">
            U
          </div>
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>
          <TopNav />
          <main className="mx-auto max-w-screen-2xl">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
