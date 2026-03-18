"use client";

import { useState } from "react";
import { useBusiness } from "@/hooks/use-businesses";

const TABS = [
  "Basic Info",
  "Progress",
  "Weekly Actions",
  "Internal Notes",
  "Files/References",
  "Log/Version",
] as const;

type Tab = (typeof TABS)[number];

interface BusinessDetailPanelProps {
  businessId: string;
  onClose: () => void;
}

export function BusinessDetailPanel({
  businessId,
  onClose,
}: BusinessDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Basic Info");
  const { data, isLoading } = useBusiness(businessId);
  const business = data?.data;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-lg font-bold truncate">
          {isLoading ? "Loading..." : business?.name ?? "Business Detail"}
        </h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-[var(--muted)] text-xl"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
        )}

        {business && activeTab === "Basic Info" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                Business Name
              </label>
              <p className="text-sm">{business.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                Company
              </label>
              <p className="text-sm">
                {(business as unknown as { company?: { canonicalName: string } })
                  .company?.canonicalName ?? "—"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  Visibility
                </label>
                <p className="text-sm">{business.visibility}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  Scale
                </label>
                <p className="text-sm">{business.scale ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  Timing
                </label>
                <p className="text-sm">{business.timingText ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  Current Stage
                </label>
                <p className="text-sm">{business.currentStage ?? "—"}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                Date Range
              </label>
              <p className="text-sm">
                {business.timingStart ?? "—"} ~ {business.timingEnd ?? "—"}
              </p>
            </div>
          </div>
        )}

        {activeTab === "Progress" && (
          <p className="text-sm text-[var(--muted-foreground)]">
            Progress blocks will be added in US2.
          </p>
        )}

        {activeTab === "Weekly Actions" && (
          <p className="text-sm text-[var(--muted-foreground)]">
            Weekly actions will be added in US3.
          </p>
        )}

        {activeTab === "Internal Notes" && (
          <p className="text-sm text-[var(--muted-foreground)]">
            Internal notes will be added in Phase 14.
          </p>
        )}

        {activeTab === "Files/References" && (
          <p className="text-sm text-[var(--muted-foreground)]">
            File attachments are planned for a future version.
          </p>
        )}

        {activeTab === "Log/Version" && (
          <p className="text-sm text-[var(--muted-foreground)]">
            Audit logs and version history will be added in US8/US9.
          </p>
        )}
      </div>
    </div>
  );
}
