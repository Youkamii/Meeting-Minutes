"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extension-placeholder";

const TEXT_COLORS = [
  { label: "기본", value: "" },
  { label: "빨강", value: "#ef4444" },
  { label: "파랑", value: "#3b82f6" },
  { label: "초록", value: "#22c55e" },
  { label: "주황", value: "#f97316" },
  { label: "보라", value: "#a855f7" },
];

const HIGHLIGHT_COLORS = [
  { label: "없음", value: "" },
  { label: "노랑", value: "#fef08a" },
  { label: "초록", value: "#bbf7d0" },
  { label: "파랑", value: "#bfdbfe" },
  { label: "분홍", value: "#fecdd3" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MiniToolbar({ editor }: { editor: any }) {
  const [showColors, setShowColors] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);

  if (!editor) return null;

  const btn = (active: boolean) =>
    `w-6 h-6 flex items-center justify-center rounded text-[10px] transition-colors ${
      active ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "hover:bg-[var(--muted)]"
    }`;

  const currentColor = editor.getAttributes("textStyle").color ?? "";

  return (
    <div className="flex items-center gap-0.5 pb-1 mb-1 border-b border-[var(--border)]">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="볼드">
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="이탤릭">
        <em>I</em>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive("strike"))} title="취소선">
        <s>S</s>
      </button>

      <span className="w-px h-4 bg-[var(--border)] mx-0.5" />

      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowColors(!showColors); setShowHighlights(false); }}
          className={`${btn(!!currentColor)} relative`}
          title="글자 색"
        >
          <span className="font-bold">A</span>
          <span className="absolute bottom-0 left-0.5 right-0.5 h-[2px] rounded-full" style={{ backgroundColor: currentColor || "var(--foreground)" }} />
        </button>
        {showColors && (
          <div className="absolute top-full left-0 mt-1 z-50 flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-1.5 shadow-lg">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => { c.value ? editor.chain().focus().setColor(c.value).run() : editor.chain().focus().unsetColor().run(); setShowColors(false); }}
                className={`w-5 h-5 rounded-full border-2 hover:scale-110 ${currentColor === c.value ? "border-[var(--primary)]" : "border-transparent"}`}
                style={{ backgroundColor: c.value || "var(--foreground)" }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowHighlights(!showHighlights); setShowColors(false); }}
          className={btn(editor.isActive("highlight"))}
          title="형광펜"
        >
          H
        </button>
        {showHighlights && (
          <div className="absolute top-full left-0 mt-1 z-50 flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-1.5 shadow-lg">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => { c.value ? editor.chain().focus().toggleHighlight({ color: c.value }).run() : editor.chain().focus().unsetHighlight().run(); setShowHighlights(false); }}
                className={`w-5 h-5 rounded-full border-2 hover:scale-110 ${editor.isActive("highlight", { color: c.value }) ? "border-[var(--primary)]" : "border-transparent"}`}
                style={{ backgroundColor: c.value || "var(--muted)" }}
              />
            ))}
          </div>
        )}
      </div>

      <span className="w-px h-4 bg-[var(--border)] mx-0.5" />

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="목록">
        •
      </button>
    </div>
  );
}

interface InlineEditorProps {
  content: string;
  placeholder?: string;
  onSave: (html: string) => void;
  onCancel: () => void;
  /** Optional status for new actions */
  status?: string;
  onStatusChange?: (status: string) => void;
}

export function InlineEditor({ content, placeholder, onSave, onCancel, status, onStatusChange }: InlineEditorProps) {
  const initialContentRef = useRef(content);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: placeholder ?? "내용 입력..." }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "outline-none min-h-[30px] text-xs",
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content || "");
      initialContentRef.current = content;
      editor.commands.focus();
    }
  }, [editor, content]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const clean = html === "<p></p>" ? "" : html;
    // Dirty check: only save if content actually changed
    if (clean !== initialContentRef.current) {
      onSave(clean);
    } else {
      onCancel();
    }
  }, [editor, onSave, onCancel]);

  const STATUS_OPTIONS = [
    { value: "scheduled", label: "예정", color: "bg-gray-400" },
    { value: "in_progress", label: "진행중", color: "bg-blue-500" },
    { value: "completed", label: "완료", color: "bg-green-500" },
    { value: "on_hold", label: "보류", color: "bg-yellow-500" },
  ];

  return (
    <div
      ref={containerRef}
      className="rounded border border-[var(--primary)] bg-[var(--background)] px-2 py-1 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        // Only save if focus leaves the entire editor container
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          handleSave();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <MiniToolbar editor={editor} />
      <EditorContent editor={editor} />
      {/* Status selector row */}
      {onStatusChange && (
        <div className="flex items-center gap-1 pt-1 mt-1 border-t border-[var(--border)]">
          <span className="text-[10px] text-[var(--muted-foreground)]">상태:</span>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                status === opt.value
                  ? `${opt.color} text-white`
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:opacity-80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
