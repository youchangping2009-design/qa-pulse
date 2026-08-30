import type {
  DailySnapshot,
  DeltaWindow,
  ProjectRecord,
  StarHistoryPoint,
} from "@/lib/types";

const WINDOWS = {
  daily: 1,
  weekly: 7,
  monthly: 30,
} as const;

function shiftDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function starsOnOrBefore(
  history: Map<string, number>,
  dates: string[],
  target: string,
): { stars: number; date: string } | null {
  for (let i = dates.length - 1; i >= 0; i -= 1) {
    const date = dates[i];
    if (date > target) continue;
    const stars = history.get(date);
    if (typeof stars === "number") return { stars, date };
  }
  return null;
}

export function historyForRepo(
  snapshots: DailySnapshot[],
  repoId: string,
): StarHistoryPoint[] {
  return snapshots
    .map((snap) => {
      const stars = snap.stars[repoId];
      return typeof stars === "number" ? { date: snap.date, stars } : null;
    })
    .filter((item): item is StarHistoryPoint => item != null)
    .slice(-30);
}

export function computeDeltas(
  currentStars: number,
  today: string,
  snapshots: DailySnapshot[],
  repoId: string,
): Pick<ProjectRecord, "delta" | "deltaWindow"> {
  const byDate = new Map<string, number>();
  for (const snap of snapshots) {
    const stars = snap.stars[repoId];
    if (typeof stars === "number") byDate.set(snap.date, stars);
  }
  const dates = [...byDate.keys()].sort();

  function windowDelta(days: number): {
    value: number | null;
    window: DeltaWindow;
  } {
    const target = shiftDate(today, -days);
    const past = starsOnOrBefore(byDate, dates, target);
    if (past) {
      return {
        value: Math.max(0, currentStars - past.stars),
        window: past.date === target ? "full" : "partial",
      };
    }
    const older = dates.filter((date) => date < today);
    if (!older.length) return { value: null, window: "missing" };
    const fallbackStars = byDate.get(older[0]);
    if (typeof fallbackStars !== "number") {
      return { value: null, window: "missing" };
    }
    return {
      value: Math.max(0, currentStars - fallbackStars),
      window: "partial",
    };
  }

  const daily = windowDelta(WINDOWS.daily);
  const weekly = windowDelta(WINDOWS.weekly);
  const monthly = windowDelta(WINDOWS.monthly);

  return {
    delta: {
      daily: daily.value,
      weekly: weekly.value,
      monthly: monthly.value,
    },
    deltaWindow: {
      daily: daily.window,
      weekly: weekly.window,
      monthly: monthly.window,
    },
  };
}
