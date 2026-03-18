"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/merge", label: "Company Merge" },
  { href: "/admin/logs", label: "Audit Logs" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Admin
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
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
