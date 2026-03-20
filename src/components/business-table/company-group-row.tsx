"use client";

import { useState } from "react";
import { KeyCompanyToggle } from "./key-company-toggle";
import type { Company } from "@/types";

interface CompanyGroupRowProps {
  company: Company;
  businessCount: number;
  children: React.ReactNode;
  dragHandleProps?: Record<string, unknown>;
}

export function CompanyGroupRow({
  company,
  businessCount,
  children,
  dragHandleProps,
}: CompanyGroupRowProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-b border-[var(--border)]">
      <div
        className="sticky left-0 z-[5] flex cursor-pointer items-center gap-2 bg-[var(--muted)] px-4 py-2 hover:bg-[var(--accent)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {dragHandleProps && (
          <span
            className="text-[var(--muted-foreground)] opacity-40 hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
            onClick={(e) => e.stopPropagation()}
            {...dragHandleProps}
            title="드래그하여 순서 변경"
          >
            ⠿
          </span>
        )}
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
          {businessCount}개 사업
        </span>
      </div>

      {expanded && <div>{children}</div>}
    </div>
  );
}
