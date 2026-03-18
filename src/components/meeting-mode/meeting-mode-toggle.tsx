"use client";

import { useUIStore } from "@/stores/ui-store";

export function MeetingModeToggle() {
  const { meetingModeActive, toggleMeetingMode } = useUIStore();

  return (
    <button
      onClick={toggleMeetingMode}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        meetingModeActive
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "border border-[var(--border)] hover:bg-[var(--muted)]"
      }`}
    >
      {meetingModeActive ? "Exit Meeting Mode" : "Meeting Mode"}
    </button>
  );
}
