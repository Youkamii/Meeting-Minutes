/**
 * ISO 8601 week utilities.
 */

export function getISOWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

export function getISOWeekYear(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return d.getUTCFullYear();
}

export function getCurrentWeek(): { year: number; weekNumber: number } {
  const now = new Date();
  return {
    year: getISOWeekYear(now),
    weekNumber: getISOWeekNumber(now),
  };
}

export function getWeekDateRange(
  year: number,
  weekNumber: number,
): { startDate: Date; endDate: Date } {
  // Find January 4th of the year (always in week 1 per ISO 8601)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // Monday = 1, Sunday = 7

  // Monday of week 1
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);

  // Monday of the target week
  const startDate = new Date(week1Monday);
  startDate.setUTCDate(week1Monday.getUTCDate() + (weekNumber - 1) * 7);

  // Sunday of the target week
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);

  return { startDate, endDate };
}

export function formatWeekLabel(year: number, weekNumber: number): string {
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

export type WeekEntry = {
  year: number;
  weekNumber: number;
  weekInMonth: number;
  /** Which month this week belongs to: "prev" | "current" | "next" */
  monthPosition: "prev" | "current" | "next";
};

/**
 * Get weeks for a given month. Only counts weeks where Monday falls in the month.
 * When includeAdjacent is true, prepends previous month's last week and appends
 * next month's first week for context.
 */
export function getWeeksInMonth(
  year: number,
  month: number, // 1-12
  options?: { includeAdjacent?: boolean },
): WeekEntry[] {
  const collectWeeks = (y: number, m: number) => {
    const result: { year: number; weekNumber: number; weekInMonth: number }[] = [];
    const daysInMonth = new Date(y, m, 0).getDate();
    let weekIndex = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(y, m - 1, day);
      if (date.getDay() === 1) {
        weekIndex++;
        result.push({
          year: getISOWeekYear(date),
          weekNumber: getISOWeekNumber(date),
          weekInMonth: weekIndex,
        });
      }
    }
    return result;
  };

  const currentWeeks = collectWeeks(year, month).map((w) => ({
    ...w,
    monthPosition: "current" as const,
  }));

  if (!options?.includeAdjacent) return currentWeeks;

  // Previous month's last week
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevWeeks = collectWeeks(prevYear, prevMonth);
  const lastPrevWeek = prevWeeks.length > 0
    ? [{ ...prevWeeks[prevWeeks.length - 1], monthPosition: "prev" as const }]
    : [];

  // Next month's first week
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextWeeks = collectWeeks(nextYear, nextMonth);
  const firstNextWeek = nextWeeks.length > 0
    ? [{ ...nextWeeks[0], monthPosition: "next" as const }]
    : [];

  // Deduplicate (edge case: last prev week = first current week)
  const result = [...lastPrevWeek, ...currentWeeks, ...firstNextWeek];
  const seen = new Set<string>();
  return result.filter((w) => {
    const key = `${w.year}-${w.weekNumber}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatMonthLabel(year: number, month: number): string {
  return `${year}년 ${month}월`;
}
