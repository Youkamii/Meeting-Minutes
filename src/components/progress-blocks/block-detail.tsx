"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUpdateProgressItem } from "@/hooks/use-progress-items";
import type { ProgressItem } from "@/types";

interface BlockDetailProps {
  item: ProgressItem;
  open: boolean;
  onClose: () => void;
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

export function BlockDetail({ item, open, onClose }: BlockDetailProps) {
  const [title, setTitle] = useState(item.title ?? "");
  const [content, setContent] = useState(item.content);
  const [date, setDate] = useState(item.date ?? "");
  const [saving, setSaving] = useState(false);
  const updateItem = useUpdateProgressItem();
  const titleRef = useRef<HTMLInputElement>(null);
  const closedRef = useRef(false);

  useEffect(() => {
    if (open) {
      closedRef.current = false;
      setTitle(item.title ?? "");
      setContent(item.content);
      setDate(item.date ?? "");
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open, item]);

  const saveAndClose = useCallback(async () => {
    if (closedRef.current || saving) return;
    closedRef.current = true;

    const changes: Record<string, unknown> = {};
    if (title.trim() !== (item.title ?? "")) changes.title = title.trim();
    if (content.trim() !== item.content) changes.content = content.trim();
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
  }, [title, content, date, item, saving, updateItem, onClose]);

  // Sync local state when a different item is selected
  useEffect(() => {
    setContent(item.content);
  }, [item.id, item.content]);

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
        className="mx-4 flex gap-5 rounded-lg border border-[var(--border)] bg-[var(--background)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: form */}
        <div className="flex-1 min-w-[320px] space-y-3">
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

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="세부내용"
            className={`${inputClass} resize-none`}
            rows={4}
          />

          <p className="text-[10px] text-[var(--muted-foreground)]">
            바깥을 클릭하거나 ✕를 누르면 자동 저장됩니다
          </p>
        </div>

        {/* Right: calendar */}
        <div className="border-l border-[var(--border)] pl-5">
          <MiniCalendar onDateClick={handleCalendarDateClick} />
        </div>
      </div>
    </div>
  );
}
