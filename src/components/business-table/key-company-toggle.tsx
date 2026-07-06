"use client";

import { useUpdateCompany } from "@/hooks/use-companies";
import { useCanEdit } from "@/lib/use-can-edit";

interface KeyCompanyToggleProps {
  companyId: string;
  isKey: boolean;
  lockVersion: number;
}

export function KeyCompanyToggle({
  companyId,
  isKey,
  lockVersion,
}: KeyCompanyToggleProps) {
  const updateCompany = useUpdateCompany();
  const canEdit = useCanEdit();

  // Read-only: show a static star indicator (only when it's a key company).
  if (!canEdit) {
    if (!isKey) return null;
    return (
      <span className="text-lg text-[var(--priority-medium)]" title="중요기업">
        ★
      </span>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        updateCompany.mutate({
          id: companyId,
          isKey: !isKey,
          lockVersion,
        });
      }}
      className={`text-lg transition-transform hover:scale-110 ${
        isKey ? "text-[var(--priority-medium)]" : "text-[var(--muted-foreground)] opacity-30 hover:opacity-70"
      }`}
      title={isKey ? "중요기업 해제" : "중요기업 지정"}
    >
      ★
    </button>
  );
}
