import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Digest, Snapshot } from "@/lib/types";

const ROOT = process.cwd();
const DIGEST_DIR = path.join(ROOT, "data", "digests");
const SNAPSHOT_DIR = path.join(ROOT, "data", "snapshots");

function ensureDirs() {
  mkdirSync(DIGEST_DIR, { recursive: true });
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

function readJson<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function loadLatestDigest(): Digest | null {
  return readJson<Digest>(path.join(DIGEST_DIR, "latest.json"));
}

export function loadDigest(weekId: string): Digest | null {
  return readJson<Digest>(path.join(DIGEST_DIR, `${weekId}.json`));
}

export function listDigestWeeks(): string[] {
  if (!existsSync(DIGEST_DIR)) return [];
  return readdirSync(DIGEST_DIR)
    .filter((name) => name.endsWith(".json") && name !== "latest.json")
    .map((name) => name.replace(/\.json$/, ""))
    .sort()
    .reverse();
}

export function saveDigest(digest: Digest) {
  ensureDirs();
  const body = JSON.stringify(digest, null, 2);
  writeFileSync(path.join(DIGEST_DIR, "latest.json"), body);
  writeFileSync(path.join(DIGEST_DIR, `${digest.weekId}.json`), body);
}

export function loadSnapshot(weekId: string): Snapshot | null {
  return readJson<Snapshot>(path.join(SNAPSHOT_DIR, `${weekId}.json`));
}

export function saveWeekBaseline(snapshot: Snapshot) {
  ensureDirs();
  const target = path.join(SNAPSHOT_DIR, `${snapshot.weekId}.json`);
  if (existsSync(target)) return;
  writeFileSync(target, JSON.stringify(snapshot, null, 2));
}

export function saveLatestSnapshot(snapshot: Snapshot) {
  ensureDirs();
  writeFileSync(
    path.join(SNAPSHOT_DIR, "latest.json"),
    JSON.stringify(snapshot, null, 2),
  );
}
