"use client";

import Link from "next/link";
import type { Company } from "@/types";

interface KeyCompaniesCardProps {
  companies: Company[];
}

export function KeyCompaniesCard({ companies }: KeyCompaniesCardProps) {
  const keyCompanies = companies.filter((c) => c.isKey);

  if (keyCompanies.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="text-sm font-semibold mb-3">★ 중요기업</h2>
      <div className="flex flex-wrap gap-2">
        {keyCompanies.map((c) => (
          <Link
            key={c.id}
            href={`/business?company=${c.id}`}
            className="rounded-md bg-[var(--priority-medium)]/10 px-3 py-1.5 text-sm font-medium text-[var(--priority-medium)] hover:bg-[var(--priority-medium)]/20 transition-colors"
          >
            {c.canonicalName}
          </Link>
        ))}
      </div>
    </div>
  );
}
