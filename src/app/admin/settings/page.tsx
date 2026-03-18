"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [weekStart, setWeekStart] = useState("monday");
  const [timezone, setTimezone] = useState("Asia/Seoul");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart, timezone }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">설정</h1>

      <div className="max-w-md space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">주 시작 요일</label>
          <select
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="monday">월요일</option>
            <option value="sunday">일요일</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">시간대</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="Asia/Seoul">Asia/Seoul (KST)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (ET)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          설정 저장
        </button>

        {saved && (
          <p className="text-sm text-green-600">설정이 저장되었습니다 (임시).</p>
        )}
      </div>

      <p className="mt-6 text-xs text-[var(--muted-foreground)]">
        설정은 아직 저장되지 않습니다. 향후 구현을 위한 임시 화면입니다.
      </p>
    </div>
  );
}
