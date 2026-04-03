"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/stores/ui-store";
import type { SearchResults } from "@/types";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const strip = (html: string) => html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const setHighlightId = useUIStore((s) => s.setSearchHighlightId);

  const { data } = useQuery<{ data: SearchResults; total: number }>({
    queryKey: ["search", query],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) =>
        r.json(),
      ),
    enabled: open && query.length >= 2,
  });

  const results = data?.data;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  // Navigate to a specific card by id (scroll + red highlight)
  const goToCard = (itemId: string) => {
    setHighlightId(itemId);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 pt-[15vh]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-4 w-full max-w-xl rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-2xl">
        <div className="flex items-center border-b border-[var(--border)] px-4">
          <span className="text-[var(--muted-foreground)]">⌕</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기업, 사업, 액션, 메모 검색..."
            className="flex-1 bg-transparent px-3 py-3 text-sm outline-none"
            autoFocus
          />
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
            ESC
          </kbd>
        </div>

        {results && (
          <div className="max-h-80 overflow-y-auto p-2">
            {data.total === 0 && query.length >= 2 && (
              <p className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                &quot;{query}&quot;에 대한 검색 결과가 없습니다
              </p>
            )}

            {results.companies.length > 0 && (
              <ResultSection title="기업">
                {results.companies.map((c) => (
                  <ResultItem
                    key={c.id}
                    title={(c as unknown as { canonicalName: string }).canonicalName}
                    subtitle="기업"
                    href="/business"
                    onClose={onClose}
                  />
                ))}
              </ResultSection>
            )}

            {results.businesses.length > 0 && (
              <ResultSection title="사업">
                {results.businesses.map((b) => (
                  <ResultItem
                    key={b.id}
                    title={b.name}
                    subtitle={`사업 · ${(b as unknown as { company?: { canonicalName: string } }).company?.canonicalName ?? ""}`}
                    href="/business"
                    onClose={onClose}
                  />
                ))}
              </ResultSection>
            )}

            {results.weeklyActions.length > 0 && (
              <ResultSection title="주간 액션">
                {results.weeklyActions.map((a) => (
                  <ResultItem
                    key={a.id}
                    title={strip((a as unknown as { content: string }).content)}
                    subtitle="주간 액션"
                    href="/weekly"
                    onClose={onClose}
                  />
                ))}
              </ResultSection>
            )}

            {results.progressItems.length > 0 && (
              <ResultSection title="진행 항목">
                {results.progressItems.map((p) => (
                  <ResultItem
                    key={p.id}
                    title={strip(p.content)}
                    subtitle={`진행 · ${p.stage}`}
                    onClick={() => goToCard(p.id)}
                  />
                ))}
              </ResultSection>
            )}

            {results.notes.length > 0 && (
              <ResultSection title="메모">
                {results.notes.map((n) => (
                  <ResultItem
                    key={n.id}
                    title={n.title ?? strip(n.body).slice(0, 60)}
                    subtitle="메모"
                    href="/business"
                    onClose={onClose}
                  />
                ))}
              </ResultSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <p className="px-2 py-1 text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">
        {title}
      </p>
      {children}
    </div>
  );
}

function ResultItem({
  title,
  subtitle,
  href,
  onClick,
  onClose,
}: {
  title: string;
  subtitle: string;
  href?: string;
  onClick?: () => void;
  onClose?: () => void;
}) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-left hover:bg-[var(--muted)] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">{title}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>
        </div>
      </button>
    );
  }

  return (
    <a
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{title}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>
      </div>
    </a>
  );
}
