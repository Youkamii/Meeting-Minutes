"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUpdateProgressItem } from "@/hooks/use-progress-items";
import type { ProgressItem } from "@/types";

interface BlockDetailProps {
  item: ProgressItem;
  open: boolean;
  onClose: () => void;
}

export function BlockDetail({ item, open, onClose }: BlockDetailProps) {
  const [title, setTitle] = useState(item.title ?? "");
  const [content, setContent] = useState(item.content);
  const [date, setDate] = useState(item.date ? String(item.date).slice(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const updateItem = useUpdateProgressItem();
  const titleRef = useRef<HTMLInputElement>(null);
  const closedRef = useRef(false);

  useEffect(() => {
    if (open) {
      closedRef.current = false;
      setTitle(item.title ?? "");
      setContent(item.content);
      setDate(item.date ? String(item.date).slice(0, 10) : "");
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open, item]);

  const saveAndClose = useCallback(async () => {
    if (closedRef.current || saving) return;
    closedRef.current = true;

    const changes: Record<string, unknown> = {};
    if (title.trim() !== (item.title ?? "")) changes.title = title.trim();
    if (content.trim() !== item.content) changes.content = content.trim();
    const origDate = item.date ? String(item.date).slice(0, 10) : "";
    if (date !== origDate) changes.date = date || null;

    if (Object.keys(changes).length > 0) {
      setSaving(true);
      try {
        await updateItem.mutateAsync({
          id: item.id,
          lockVersion: item.lockVersion,
          ...changes,
        });
      } catch (e) {
        console.error("저장 실패:", e);
      }
      setSaving(false);
    }
    onClose();
  }, [title, content, date, item, saving, updateItem, onClose]);

  if (!open) return null;

  const inputClass =
    "w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={saveAndClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] p-5 shadow-xl space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--muted-foreground)] capitalize">
            {item.stage}
          </span>
          <button onClick={saveAndClose} disabled={saving} className="text-sm hover:opacity-70">
            {saving ? "저장 중..." : "✕"}
          </button>
        </div>

        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className={`${inputClass} font-medium`}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="세부내용"
          className={`${inputClass} resize-none`}
          rows={4}
        />
      </div>
    </div>
  );
}
