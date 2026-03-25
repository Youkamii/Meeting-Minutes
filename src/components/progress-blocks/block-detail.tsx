"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extension-placeholder";
import DOMPurify from "dompurify";
import { useUpdateProgressItem } from "@/hooks/use-progress-items";
import { useWeeklyActions, useCurrentCycle, useWeeklyCycles } from "@/hooks/use-weekly-actions";
import { getISOWeekNumber, getISOWeekYear } from "@/lib/weekly-cycle";
import type { ProgressItem, WeeklyAction } from "@/types";

interface BlockDetailProps {
  item: ProgressItem;
  open: boolean;
  onClose: () => void;
  companyId?: string;
}

function MiniCalendar({ onDateClick }: { onDateClick: (day: number, month: number, year: number) => void }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const today = new Date();
  const isToday = (d: number) =>
    year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

  return (
    <div className="w-[220px] shrink-0 select-none">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="text-sm px-1 hover:bg-[var(--muted)] rounded">&lt;</button>
        <span className="text-sm font-medium">{year}년 {month + 1}월</span>
        <button onClick={nextMonth} className="text-sm px-1 hover:bg-[var(--muted)] rounded">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="text-[var(--muted-foreground)] py-1 font-medium">{d}</div>
        ))}
        {days.map((day, i) => (
          <div key={i}>
            {day ? (
              <button
                onClick={() => onDateClick(day, month, year)}
                className={`w-7 h-7 rounded-full text-xs hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-colors ${
                  isToday(day) ? "bg-[var(--primary)]/20 font-bold" : ""
                }`}
              >
                {day}
              </button>
            ) : (
              <div className="w-7 h-7" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
function EditorToolbar({ editor }: { editor: any }) {
  const [showColors, setShowColors] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `w-7 h-7 flex items-center justify-center rounded transition-colors ${
      active
        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
        : "text-[var(--foreground)] hover:bg-[var(--muted)]"
    }`;

  const currentColor = editor.getAttributes("textStyle").color ?? "";

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border)]">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive("bold"))}
        title="볼드 (Ctrl+B)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive("italic"))}
        title="이탤릭 (Ctrl+I)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive("strike"))}
        title="취소선"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4H9a3 3 0 0 0-3 3v.5"/><path d="M4 12h16"/><path d="M8 20h7a3 3 0 0 0 3-3v-.5"/></svg>
      </button>

      <span className="w-px h-5 bg-[var(--border)] mx-1" />

      {/* Text color */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowColors(!showColors); setShowHighlights(false); }}
          className={`${btnClass(!!currentColor)} relative`}
          title="글자 색"
        >
          <span className="text-xs font-bold">A</span>
          <span
            className="absolute bottom-0.5 left-1 right-1 h-[3px] rounded-full"
            style={{ backgroundColor: currentColor || "var(--foreground)" }}
          />
        </button>
        {showColors && (
          <div className="absolute top-full left-0 mt-1 z-50 flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 shadow-lg">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  if (c.value) editor.chain().focus().setColor(c.value).run();
                  else editor.chain().focus().unsetColor().run();
                  setShowColors(false);
                }}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  currentColor === c.value ? "border-[var(--primary)] scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c.value || "var(--foreground)" }}
                title={c.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Highlight */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowHighlights(!showHighlights); setShowColors(false); }}
          className={btnClass(editor.isActive("highlight"))}
          title="형광펜"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
        </button>
        {showHighlights && (
          <div className="absolute top-full left-0 mt-1 z-50 flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 shadow-lg">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  if (c.value) editor.chain().focus().toggleHighlight({ color: c.value }).run();
                  else editor.chain().focus().unsetHighlight().run();
                  setShowHighlights(false);
                }}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  editor.isActive("highlight", { color: c.value }) ? "border-[var(--primary)] scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c.value || "var(--muted)" }}
                title={c.label}
              >
                {!c.value && <span className="text-[8px]">✕</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="w-px h-5 bg-[var(--border)] mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive("bulletList"))}
        title="목록"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive("orderedList"))}
        title="번호 목록"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">1</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">2</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">3</text></svg>
      </button>
    </div>
  );
}

const MIN_WIDTH = 540;
const MIN_HEIGHT = 400;
const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 780;

export function BlockDetail({ item, open, onClose, companyId }: BlockDetailProps) {
  const [title, setTitle] = useState(item.title ?? "");
  const [date, setDate] = useState(item.date ?? "");
  const [saving, setSaving] = useState(false);
  const updateItem = useUpdateProgressItem();
  const titleRef = useRef<HTMLInputElement>(null);
  const closedRef = useRef(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT });
  const resizing = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const resizeCleanup = useRef<(() => void) | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: "세부내용..." }),
    ],
    content: item.content || "",
    editorProps: {
      attributes: {
        class: "outline-none min-h-[60px] px-3 py-2 text-sm",
      },
    },
  });

  // Cleanup resize listeners on unmount
  useEffect(() => {
    return () => { resizeCleanup.current?.(); };
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const newW = Math.max(MIN_WIDTH, resizing.current.startW + (ev.clientX - resizing.current.startX));
      const newH = Math.max(MIN_HEIGHT, resizing.current.startH + (ev.clientY - resizing.current.startY));
      setSize({ w: newW, h: newH });
    };
    const cleanup = () => {
      resizing.current = null;
      resizeCleanup.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", cleanup);
    };
    resizeCleanup.current = cleanup;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", cleanup);
  }, [size]);

  useEffect(() => {
    if (open) {
      closedRef.current = false;
      setTitle(item.title ?? "");
      setDate(item.date ?? "");
      setSize({ w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT });
      editor?.commands.setContent(item.content || "");
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open, item, editor]);

  const saveAndClose = useCallback(async () => {
    if (closedRef.current || saving) return;
    closedRef.current = true;

    const editorHtml = editor?.getHTML() ?? "";
    const cleanContent = editorHtml === "<p></p>" ? "" : editorHtml;

    const changes: Record<string, unknown> = {};
    if (title.trim() !== (item.title ?? "")) changes.title = title.trim();
    if (cleanContent !== item.content) changes.content = cleanContent;
    const origDate = item.date ?? "";
    if (date !== origDate) changes.date = date || "";

    if (Object.keys(changes).length > 0) {
      setSaving(true);
      try {
        await updateItem.mutateAsync({
          id: item.id,
          lockVersion: item.lockVersion,
          ...changes,
        });
      } catch (e) {
        console.error("저장 실패:", e instanceof Error ? e.message : e);
        alert("저장에 실패했습니다: " + (e instanceof Error ? e.message : "알 수 없는 오류"));
      }
      setSaving(false);
    }
    onClose();
  }, [title, date, item, saving, updateItem, onClose, editor]);

  // Sync editor content when a different item is selected
  useEffect(() => {
    editor?.commands.setContent(item.content || "");
  }, [item.id, item.content, editor]);

  // Weekly actions for right panel
  const weeklyNow = new Date();
  const currentWeekNum = getISOWeekNumber(weeklyNow);
  const currentWeekYear = getISOWeekYear(weeklyNow);
  const { data: currentCycleData } = useCurrentCycle();
  const { data: allCyclesData } = useWeeklyCycles(currentWeekYear);
  const weeklyCycle = currentCycleData?.data;
  const weeklyCycles = allCyclesData?.data ?? [];
  const prevWeeklyCycle = weeklyCycles.find(
    (c) => (c.year === currentWeekYear && c.weekNumber === currentWeekNum - 1) ||
           (currentWeekNum === 1 && c.year === currentWeekYear - 1 && c.weekNumber >= 52),
  );
  const nextWeeklyCycle = weeklyCycles.find(
    (c) => (c.year === currentWeekYear && c.weekNumber === currentWeekNum + 1) ||
           (currentWeekNum >= 52 && c.year === currentWeekYear + 1 && c.weekNumber === 1),
  );

  const { data: prevWeekActions } = useWeeklyActions(
    prevWeeklyCycle ? { cycleId: prevWeeklyCycle.id } : undefined,
  );
  const { data: thisWeekActions } = useWeeklyActions(
    weeklyCycle ? { cycleId: weeklyCycle.id } : undefined,
  );
  const { data: nextWeekActions } = useWeeklyActions(
    nextWeeklyCycle ? { cycleId: nextWeeklyCycle.id } : undefined,
  );

  const filterByCompany = (data: WeeklyAction[]) =>
    companyId ? data.filter((a) => a.companyId === companyId) : [];

  const prevWeekItems = filterByCompany((prevWeekActions?.data ?? []) as WeeklyAction[]);
  const thisWeekItems = filterByCompany((thisWeekActions?.data ?? []) as WeeklyAction[]);
  const nextWeekItems = filterByCompany((nextWeekActions?.data ?? []) as WeeklyAction[]);

  if (!open) return null;

  const inputClass =
    "w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]";

  const handleCalendarDateClick = (day: number, month: number, year: number) => {
    const yyyy = String(year);
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    setDate((prev) => (prev ? `${prev} ${dateStr}` : dateStr));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={saveAndClose}
    >
      <div
        ref={modalRef}
        className="relative mx-4 flex gap-5 rounded-lg border border-[var(--border)] bg-[var(--background)] p-5 shadow-xl"
        style={{ width: size.w, height: size.h }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: form */}
        <div className="flex flex-1 min-w-0 flex-col gap-3">
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
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="기간 (달력에서 날짜 클릭 시 자동 입력)"
            className={inputClass}
          />

          <div className="flex flex-1 min-h-0 flex-col rounded-md border border-[var(--border)] bg-[var(--background)] overflow-hidden">
            <EditorToolbar editor={editor} />
            <div className="flex-1 overflow-y-auto">
              <EditorContent editor={editor} className="h-full" />
            </div>
          </div>

          <p className="text-[10px] text-[var(--muted-foreground)] shrink-0">
            바깥을 클릭하거나 ✕를 누르면 자동 저장됩니다
          </p>
        </div>

        {/* Right: calendar + weekly actions */}
        <div className="w-[300px] shrink-0 border-l border-[var(--border)] pl-5 flex flex-col overflow-y-auto">
          <div className="shrink-0 flex justify-center">
            <MiniCalendar onDateClick={handleCalendarDateClick} />
          </div>

          {/* Weekly actions */}
          {companyId && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-4 flex-1 min-h-0">
              {[
                { label: "지난 주", items: prevWeekItems },
                { label: "이번 주", items: thisWeekItems },
                { label: "다음 주", items: nextWeekItems },
              ].map(({ label, items }) => (
                <div key={label}>
                  <h4 className="text-xs font-bold text-[var(--muted-foreground)] mb-1.5">
                    {label}
                  </h4>
                  {items.length === 0 ? (
                    <p className="text-[10px] text-[var(--muted-foreground)]">내용 없음</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {items.map((a) => (
                        <div
                          key={a.id}
                          className="rounded bg-[var(--muted)] px-2 py-1.5 text-xs break-words [&_p]:m-0 [&_ul]:pl-3 [&_ul]:list-disc [&_ol]:pl-3 [&_ol]:list-decimal"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a.content) }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4 text-[var(--muted-foreground)] opacity-50">
            <path d="M14 14H10M14 14V10M14 8V14H8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
