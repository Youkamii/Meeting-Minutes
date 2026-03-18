"use client";

interface AssigneePickerProps {
  value: string | null;
  onChange: (assigneeId: string | null) => void;
}

export function AssigneePicker({ value, onChange }: AssigneePickerProps) {
  // In the initial version without auth, this is a simple text input
  // When auth is added, this will become a user selector dropdown
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      onClick={(e) => e.stopPropagation()}
      placeholder="Assignee"
      className="w-24 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-[var(--ring)]"
    />
  );
}
