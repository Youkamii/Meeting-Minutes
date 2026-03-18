"use client";

import type { Company } from "@/types";

interface KeyCompaniesCardProps {
  companies: Company[];
}

export function KeyCompaniesCard({ companies }: KeyCompaniesCardProps) {
  const keyCompanies = companies.filter((c) => c.isKey);

  if (keyCompanies.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="text-sm font-bold mb-3">★ Key Companies</h2>
      <div className="flex flex-wrap gap-2">
        {keyCompanies.map((c) => (
          <a
            key={c.id}
            href="/business"
            className="rounded-md bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 transition-colors"
          >
            {c.canonicalName}
          </a>
        ))}
      </div>
    </div>
  );
}
