"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SearchResults } from "@/types";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");

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
            placeholder="Search companies, businesses, actions, notes..."
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
                No results for &quot;{query}&quot;
              </p>
            )}

            {results.companies.length > 0 && (
              <ResultSection title="Companies">
                {results.companies.map((c) => (
                  <ResultItem
                    key={c.id}
                    title={(c as unknown as { canonicalName: string }).canonicalName}
                    subtitle="Company"
                    href={`/business`}
                    onClose={onClose}
                  />
                ))}
              </ResultSection>
            )}

            {results.businesses.length > 0 && (
              <ResultSection title="Businesses">
                {results.businesses.map((b) => (
                  <ResultItem
                    key={b.id}
                    title={b.name}
                    subtitle={`Business · ${(b as unknown as { company?: { canonicalName: string } }).company?.canonicalName ?? ""}`}
                    href={`/business`}
                    onClose={onClose}
                  />
                ))}
              </ResultSection>
            )}

            {results.weeklyActions.length > 0 && (
              <ResultSection title="Weekly Actions">
                {results.weeklyActions.map((a) => (
                  <ResultItem
                    key={a.id}
                    title={(a as unknown as { content: string }).content}
                    subtitle="Weekly Action"
                    href={`/weekly`}
                    onClose={onClose}
                  />
                ))}
              </ResultSection>
            )}

            {results.progressItems.length > 0 && (
              <ResultSection title="Progress Items">
                {results.progressItems.map((p) => (
                  <ResultItem
                    key={p.id}
                    title={p.content}
                    subtitle={`Progress · ${p.stage}`}
                    href={`/business`}
                    onClose={onClose}
                  />
                ))}
              </ResultSection>
            )}

            {results.notes.length > 0 && (
              <ResultSection title="Notes">
                {results.notes.map((n) => (
                  <ResultItem
                    key={n.id}
                    title={n.title ?? n.body.slice(0, 60)}
                    subtitle="Note"
                    href={`/business`}
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
  onClose,
}: {
  title: string;
  subtitle: string;
  href: string;
  onClose: () => void;
}) {
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
