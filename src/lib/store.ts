import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type { DailySnapshot, Dataset } from "@/lib/types";
import { toIsoDate } from "@/lib/week";

const ROOT = process.cwd();
const SNAPSHOT_DIR = path.join(ROOT, "data", "snapshots");
const PROJECTS_FILE = path.join(ROOT, "data", "projects.json");
const DATE_FILE = /^\d{4}-\d{2}-\d{2}\.json$/;
const WEEK_FILE = /^\d{4}-W\d{2}\.json$/;

function ensureDir() {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

function readJson<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function loadDataset(): Dataset | null {
  return readJson<Dataset>(PROJECTS_FILE);
}

export function saveDataset(dataset: Dataset) {
  writeFileSync(PROJECTS_FILE, `${JSON.stringify(dataset, null, 2)}\n`);
}

export function loadDailySnapshot(date: string): DailySnapshot | null {
  return readJson<DailySnapshot>(path.join(SNAPSHOT_DIR, `${date}.json`));
}

export function saveDailySnapshot(snapshot: DailySnapshot) {
  ensureDir();
  writeFileSync(
    path.join(SNAPSHOT_DIR, `${snapshot.date}.json`),
    `${JSON.stringify(snapshot, null, 2)}\n`,
  );
}

export function listSnapshotDates(): string[] {
  if (!existsSync(SNAPSHOT_DIR)) return [];
  return readdirSync(SNAPSHOT_DIR)
    .filter((name) => DATE_FILE.test(name))
    .map((name) => name.replace(/\.json$/, ""))
    .sort();
}

export function loadSnapshotHistory(): DailySnapshot[] {
  migrateLegacySnapshots();
  return listSnapshotDates()
    .map((date) => loadDailySnapshot(date))
    .filter((item): item is DailySnapshot => item != null);
}

/** 把旧的周快照转成按日文件，只转换一次。 */
export function migrateLegacySnapshots() {
  if (!existsSync(SNAPSHOT_DIR)) return;
  for (const name of readdirSync(SNAPSHOT_DIR)) {
    if (!WEEK_FILE.test(name) && name !== "latest.json") continue;
    const raw = readJson<{
      weekId?: string;
      capturedAt?: string;
      date?: string;
      stars?: Record<string, number>;
    }>(path.join(SNAPSHOT_DIR, name));
    if (!raw?.stars) continue;
    const date =
      raw.date ||
      (raw.capturedAt ? toIsoDate(new Date(raw.capturedAt)) : null);
    if (!date || loadDailySnapshot(date)) continue;
    saveDailySnapshot({
      date,
      capturedAt: raw.capturedAt ?? new Date().toISOString(),
      stars: raw.stars,
    });
  }
}
