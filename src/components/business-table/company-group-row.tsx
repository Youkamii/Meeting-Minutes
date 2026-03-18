"use client";

import { useState } from "react";
import { KeyCompanyToggle } from "./key-company-toggle";
import type { Company } from "@/types";

interface CompanyGroupRowProps {
  company: Company;
  businessCount: number;
  children: React.ReactNode;
}

export function CompanyGroupRow({
  company,
  businessCount,
  children,
}: CompanyGroupRowProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-b border-[var(--border)]">
      <div
        className="flex cursor-pointer items-center gap-2 bg-[var(--muted)] px-4 py-2 hover:bg-[var(--accent)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xs text-[var(--muted-foreground)] w-4">
          {expanded ? "▼" : "▶"}
        </span>

        <KeyCompanyToggle
          companyId={company.id}
          isKey={company.isKey}
          lockVersion={company.lockVersion}
        />

        <span className="font-semibold text-sm">{company.canonicalName}</span>

        {company.aliases.length > 0 && (
          <span className="text-xs text-[var(--muted-foreground)]">
            ({company.aliases.join(", ")})
          </span>
        )}

        <span className="ml-auto text-xs text-[var(--muted-foreground)]">
          {businessCount} business{businessCount !== 1 ? "es" : ""}
        </span>
      </div>

      {expanded && <div>{children}</div>}
    </div>
  );
}
