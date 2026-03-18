"use client";

import { useUpdateCompany } from "@/hooks/use-companies";

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
        isKey ? "text-yellow-500" : "text-[var(--muted-foreground)] opacity-30 hover:opacity-70"
      }`}
      title={isKey ? "중요기업 해제" : "중요기업 지정"}
    >
      ★
    </button>
  );
}
