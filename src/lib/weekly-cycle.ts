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
