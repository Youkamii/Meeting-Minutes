"use client";

import { useState } from "react";
import { useUpdateProgressItem, useDeleteProgressItem } from "@/hooks/use-progress-items";
import type { ProgressItem } from "@/types";

interface BlockDetailProps {
  item: ProgressItem;
  open: boolean;
  onClose: () => void;
}

export function BlockDetail({ item, open, onClose }: BlockDetailProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(item.content);
  const updateItem = useUpdateProgressItem();
  const deleteItem = useDeleteProgressItem();

  if (!open) return null;

  const handleSave = () => {
    updateItem.mutate(
      { id: item.id, content, lockVersion: item.lockVersion },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleDelete = () => {
    if (confirm("이 진행 블록을 삭제하시겠습니까?")) {
      deleteItem.mutate(item.id, { onSuccess: onClose });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-4 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">진행 블록</h3>
          <button onClick={onClose} className="text-lg hover:opacity-70">
            ✕
          </button>
        </div>

        <div className="mt-2 text-xs text-[var(--muted-foreground)]">
          단계: <span className="font-medium capitalize">{item.stage}</span> |
          생성일: {new Date(item.createdAt).toLocaleDateString("ko-KR")}
        </div>

        {editing ? (
          <div className="mt-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              rows={4}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setContent(item.content);
                  setEditing(false);
                }}
                className="rounded-md border border-[var(--border)] px-3 py-1 text-sm"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="rounded-md bg-[var(--primary)] px-3 py-1 text-sm text-[var(--primary-foreground)]"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 whitespace-pre-wrap text-sm">{item.content}</p>
        )}

        <div className="mt-6 flex gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--muted)]"
            >
              수정
            </button>
          )}
          <button
            onClick={handleDelete}
            className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
