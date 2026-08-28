/** 以 UTC 周一为一周起点，生成 ISO 周编号。 */

export type WeekRange = {
  weekId: string;
  weekStart: string;
  weekEnd: string;
  startDate: Date;
};

function utcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function getWeekRange(now = new Date()): WeekRange {
  const day = utcDay(now);
  const weekday = day.getUTCDay() || 7;
  if (weekday !== 1) {
    day.setUTCDate(day.getUTCDate() - (weekday - 1));
  }
  const end = new Date(day);
  end.setUTCDate(end.getUTCDate() + 6);

  const iso = getIsoWeek(day);
  return {
    weekId: `${iso.year}-W${String(iso.week).padStart(2, "0")}`,
    weekStart: toIsoDate(day),
    weekEnd: toIsoDate(end),
    startDate: day,
  };
}

export function previousWeekId(weekId: string): string {
  const [yearStr, weekStr] = weekId.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);
  if (week > 1) {
    return `${year}-W${String(week - 1).padStart(2, "0")}`;
  }
  const prev = new Date(Date.UTC(year, 0, 4));
  prev.setUTCDate(prev.getUTCDate() - 7);
  const iso = getIsoWeek(prev);
  return `${iso.year}-W${String(iso.week).padStart(2, "0")}`;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getIsoWeek(date: Date): { year: number; week: number } {
  const d = utcDay(date);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function formatCnDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

export function formatCnDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
