"use client";

import { useState } from "react";
import type { InternalNote, NoteTag } from "@/types";

interface NotesTimelineProps {
  notes: InternalNote[];
  ownerType: string;
  ownerId: string;
  onAdd: (data: { owner_type: string; owner_id: string; title?: string; body: string; tag?: NoteTag }) => void;
  onUpdate?: (data: { id: string; title?: string; body: string; tag?: NoteTag; lockVersion: number }) => void;
  isAdding?: boolean;
}

const tagColors: Record<NoteTag, string> = {
  situation: "bg-blue-100 text-blue-800",
  decision: "bg-purple-100 text-purple-800",
  risk: "bg-red-100 text-red-800",
  follow_up: "bg-yellow-100 text-yellow-800",
};

export function NotesTimeline({
  notes,
  ownerType,
  ownerId,
  onAdd,
  isAdding = false,
}: NotesTimelineProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<NoteTag | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    onAdd({
      owner_type: ownerType,
      owner_id: ownerId,
      title: title.trim() || undefined,
      body: body.trim(),
      tag: (tag as NoteTag) || undefined,
    });
    setTitle("");
    setBody("");
    setTag("");
  };

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
      >
        <h3 className="mb-2 text-sm font-bold">메모 추가</h3>
        <input
          type="text"
          placeholder="제목 (선택사항)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-2 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
        />
        <textarea
          placeholder="메모를 작성하세요..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="mb-2 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm resize-none"
        />
        <div className="flex items-center gap-2">
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value as NoteTag | "")}
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs"
          >
            <option value="">태그 없음</option>
            <option value="situation">상황</option>
            <option value="decision">결정</option>
            <option value="risk">위험</option>
            <option value="follow_up">후속조치</option>
          </select>
          <button
            type="submit"
            disabled={!body.trim() || isAdding}
            className="ml-auto rounded-md bg-[var(--primary)] px-3 py-1 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {isAdding ? "추가 중..." : "추가"}
          </button>
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          >
            <div className="flex items-center gap-2 mb-1">
              {note.title && (
                <span className="text-sm font-medium">{note.title}</span>
              )}
              {note.tag && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagColors[note.tag]}`}
                >
                  {note.tag.replace("_", " ")}
                </span>
              )}
              <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">
                {new Date(note.createdAt).toLocaleString("ko-KR")}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{note.body}</p>
          </div>
        ))}

        {notes.length === 0 && (
          <p className="text-sm text-[var(--muted-foreground)]">
            메모가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
