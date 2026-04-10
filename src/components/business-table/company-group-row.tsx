"use client";

import { useState } from "react";
import { KeyCompanyToggle } from "./key-company-toggle";
import type { Company } from "@/types";

interface CompanyGroupRowProps {
  company: Company;
  businessCount: number;
  children: React.ReactNode;
  dragHandleProps?: Record<string, unknown>;
  highlighted?: boolean;
}

export function CompanyGroupRow({
  company,
  businessCount,
  children,
  dragHandleProps,
  highlighted,
}: CompanyGroupRowProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div data-company-id={company.id} className={`border-b border-[var(--border)] transition-colors duration-700 ${highlighted ? "ring-2 ring-blue-500 ring-inset" : ""}`} style={{ background: "var(--background)" }}>
      <div
        className="flex cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Sticky left — company info */}
        <div className="sticky left-0 z-[5] flex w-[280px] shrink-0 items-center gap-2 bg-[var(--muted)] px-4 py-2 group-hover:bg-[var(--accent)] transition-colors">
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

          <span className="font-semibold text-sm truncate">{company.canonicalName}</span>

          {company.aliases.length > 0 && (
            <span className="text-xs text-[var(--muted-foreground)] truncate">
              ({company.aliases.join(", ")})
            </span>
          )}
        </div>

        {/* Right — fills remaining width, same bg, no left border */}
        <div className="flex-1 flex items-center bg-[var(--muted)] group-hover:bg-[var(--accent)] transition-colors px-4 py-2">
          <span className="ml-auto text-xs text-[var(--muted-foreground)]">
            {businessCount}개 사업
          </span>
        </div>
      </div>

      {expanded && <div>{children}</div>}
    </div>
  );
}
