"use client";

import { useState } from "react";
import { useCompanies } from "@/hooks/use-companies";
import { fetchJson } from "@/lib/fetch";
import type { Company } from "@/types";

export default function MergePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Company[]>([]);
  const [canonicalId, setCanonicalId] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const { data: companiesData } = useCompanies({
    search: search || undefined,
  });
  const companies = companiesData?.data ?? [];

  const toggleSelect = (company: Company) => {
    setSelected((prev) =>
      prev.find((c) => c.id === company.id)
        ? prev.filter((c) => c.id !== company.id)
        : [...prev, company],
    );
  };

  const handleMerge = async () => {
    if (!canonicalId || selected.length < 2) return;
    const mergeIds = selected
      .filter((c) => c.id !== canonicalId)
      .map((c) => c.id);

    setMerging(true);
    setResult(null);
    try {
      await fetchJson("/api/companies/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonical_id: canonicalId, merge_ids: mergeIds }),
      });
      setResult("병합이 완료되었습니다.");
      setSelected([]);
      setCanonicalId(null);
    } catch {
      setResult("병합에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setMerging(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">기업 병합</h1>

      <input
        type="text"
        placeholder="기업 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-md rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
      />

      <div className="mb-4 max-h-60 overflow-y-auto rounded-md border border-[var(--border)]">
        {companies.map((company) => {
          const isSelected = selected.some((c) => c.id === company.id);
          return (
            <button
              key={company.id}
              onClick={() => toggleSelect(company)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                isSelected
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "hover:bg-[var(--muted)]"
              }`}
            >
              <span className="flex-1">{company.canonicalName}</span>
              {company.aliases.length > 0 && (
                <span className="text-xs opacity-70">
                  ({company.aliases.join(", ")})
                </span>
              )}
            </button>
          );
        })}
        {companies.length === 0 && (
          <p className="px-3 py-4 text-sm text-[var(--muted-foreground)]">
            검색된 기업이 없습니다.
          </p>
        )}
      </div>

      {selected.length >= 2 && (
        <div className="mb-4 rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-sm font-bold">
            선택됨 ({selected.length}) - 대표 기업을 선택하세요:
          </h2>
          <div className="space-y-1">
            {selected.map((company) => (
              <label
                key={company.id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="canonical"
                  checked={canonicalId === company.id}
                  onChange={() => setCanonicalId(company.id)}
                />
                <span className="font-medium">{company.canonicalName}</span>
              </label>
            ))}
          </div>

          {canonicalId && (
            <div className="mt-3 rounded-md bg-[var(--muted)] p-3 text-xs">
              <p className="font-medium">미리보기:</p>
              <p>
                대표 기업:{" "}
                {selected.find((c) => c.id === canonicalId)?.canonicalName}
              </p>
              <p>
                병합 대상:{" "}
                {selected
                  .filter((c) => c.id !== canonicalId)
                  .map((c) => c.canonicalName)
                  .join(", ")}
              </p>
              <p>
                모든 사업과 주간 액션이 대표 기업으로 재연결됩니다.
              </p>
            </div>
          )}

          <button
            onClick={handleMerge}
            disabled={!canonicalId || merging}
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {merging ? "병합 중..." : "병합 확인"}
          </button>
        </div>
      )}

      {selected.length > 0 && selected.length < 2 && (
        <p className="text-sm text-[var(--muted-foreground)]">
          병합하려면 최소 2개의 기업을 선택하세요.
        </p>
      )}

      {result && (
        <p className="mt-2 rounded-md bg-[var(--muted)] px-3 py-2 text-sm">
          {result}
        </p>
      )}
    </div>
  );
}
