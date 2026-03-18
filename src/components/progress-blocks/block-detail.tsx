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
  const [content, setContent] = useState(item.content);
  const updateItem = useUpdateProgressItem();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save and close
  const saveAndClose = useCallback(() => {
    const trimmed = content.trim();
    if (trimmed && trimmed !== item.content) {
      updateItem.mutate({
        id: item.id,
        content: trimmed,
        lockVersion: item.lockVersion,
      });
    }
    onClose();
  }, [content, item.content, item.id, item.lockVersion, updateItem, onClose]);

  // Focus textarea on open
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={saveAndClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--muted-foreground)]">
            <span className="font-medium capitalize">{item.stage}</span>
            {" · "}
            {new Date(item.createdAt).toLocaleDateString("ko-KR")}
          </span>
          <button onClick={saveAndClose} className="text-sm hover:opacity-70">
            ✕
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full resize-none rounded-md border-0 bg-transparent text-sm outline-none leading-relaxed"
          rows={5}
          placeholder="내용을 입력하세요..."
        />
      </div>
    </div>
  );
}
