"use client";

import { useState, useMemo, useEffect } from "react";
import { useCompanies } from "@/hooks/use-companies";
import { useBusinesses } from "@/hooks/use-businesses";
import { CompanyGroupRow } from "@/components/business-table/company-group-row";
import { BusinessRow } from "@/components/business-table/business-row";
import { BusinessDetailPanel } from "@/components/business-table/business-detail-panel";
import { NewCompanyDialog } from "@/components/business-table/new-company-dialog";
import { NewBusinessDialog } from "@/components/business-table/new-business-dialog";
import { QuickActionsBar } from "@/components/ui/quick-actions";
import { ExcelDownloadDialog } from "@/components/export/excel-download-dialog";
import type { Company } from "@/types";

export default function BusinessManagementPage() {
  const [search, setSearch] = useState("");
  const [showKeyOnly, setShowKeyOnly] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    null,
  );
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewBusiness, setShowNewBusiness] = useState(false);
  const [showExcelDownload, setShowExcelDownload] = useState(false);

  // Disable body scroll so only our container scrolls
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const { data: companiesData, isLoading: companiesLoading } = useCompanies({
    search,
    isKey: showKeyOnly ? true : undefined,
  });
  const { data: businessesData, isLoading: businessesLoading } = useBusinesses({
    search,
  });

  const companies = companiesData?.data ?? [];
  const businesses = businessesData?.data ?? [];

  // Group businesses by company, key companies first
  const groupedData = useMemo(() => {
    const sortedCompanies = [...companies].sort((a, b) => {
      if (a.isKey !== b.isKey) return a.isKey ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });

    return sortedCompanies.map((company) => ({
      company,
      businesses: businesses.filter(
        (b) => (b as unknown as { companyId: string }).companyId === company.id,
      ),
    }));
  }, [companies, businesses]);

  const isLoading = companiesLoading || businessesLoading;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        <h1 className="text-lg font-bold">사업관리</h1>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="기업 및 사업 검색..."
          className="h-8 w-64 rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />

        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showKeyOnly}
            onChange={(e) => setShowKeyOnly(e.target.checked)}
            className="rounded"
          />
          중요기업만
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowExcelDownload(true)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)] transition-colors"
          >
            엑셀 다운로드
          </button>
          <QuickActionsBar
            actions={[
              { label: "기업", onClick: () => setShowNewCompany(true) },
              { label: "사업", onClick: () => setShowNewBusiness(true) },
            ]}
          />
        </div>
      </div>

      {/* Table — single scroll container for both axes, fills remaining viewport */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
          </div>
        )}

        {!isLoading && groupedData.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <p className="text-lg font-medium">등록된 기업이 없습니다</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              첫 번째 기업을 생성하여 시작하세요.
            </p>
            <button
              onClick={() => setShowNewCompany(true)}
              className="mt-4 rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90"
            >
              + 새 기업
            </button>
          </div>
        )}

        {/* Inner wide content */}
        <div className="w-max min-w-full">
          {/* Stage column headers */}
          {groupedData.length > 0 && (
            <div className="sticky top-0 z-10 flex border-b border-[var(--border)] bg-[var(--background)]">
              <div className="w-[280px] shrink-0 border-r border-[var(--border)] px-4 py-2">
                <span className="text-sm font-semibold text-[var(--muted-foreground)]">
                  사업 정보
                </span>
              </div>
              {[
                "Inbound(초도미팅)",
                "Funnel",
                "Pipeline",
                "제안",
                "계약",
                "구축",
                "유지보수",
              ].map((label) => (
                <div
                  key={label}
                  className="w-[300px] shrink-0 border-r border-[var(--border)] px-2 py-2"
                >
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {groupedData.map(({ company, businesses: bizList }) => (
            <CompanyGroupRow
              key={company.id}
              company={company}
              businessCount={bizList.length}
            >
              {bizList.length === 0 && (
                <div className="px-8 py-3 text-xs text-[var(--muted-foreground)]">
                  등록된 사업이 없습니다.{" "}
                  <button
                    onClick={() => setShowNewBusiness(true)}
                    className="text-[var(--primary)] hover:underline"
                  >
                    추가하기
                  </button>
                </div>
              )}
              {bizList.map((biz) => (
                <BusinessRow
                  key={biz.id}
                  business={{ ...(biz as unknown as Record<string, unknown>), companyName: company.canonicalName } as never}
                  onClick={() => setSelectedBusinessId(biz.id)}
                />
              ))}
            </CompanyGroupRow>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedBusinessId && (
        <BusinessDetailPanel
          businessId={selectedBusinessId}
          onClose={() => setSelectedBusinessId(null)}
        />
      )}

      {/* Dialogs */}
      <NewCompanyDialog
        open={showNewCompany}
        onClose={() => setShowNewCompany(false)}
      />
      <NewBusinessDialog
        open={showNewBusiness}
        onClose={() => setShowNewBusiness(false)}
        companies={companies as Company[]}
      />
      <ExcelDownloadDialog
        open={showExcelDownload}
        onClose={() => setShowExcelDownload(false)}
        defaultType="monthly"
      />
    </div>
  );
}
