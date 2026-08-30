import { loadCatalog, slugFromFullName } from "@/lib/catalog";
import { loadConfig, publicConfigStatus } from "@/lib/config";
import { discoverRepos } from "@/lib/discover";
import {
  createGithubClient,
  mapWithConcurrency,
  type GithubRepoPayload,
} from "@/lib/github";
import { inferTags } from "@/lib/relevance";
import {
  loadDataset,
  loadSnapshotHistory,
  saveDailySnapshot,
  saveDataset,
} from "@/lib/store";
import { computeDeltas, historyForRepo } from "@/lib/trends";
import type {
  CatalogEntry,
  Dataset,
  ProjectRecord,
  ProjectStatus,
} from "@/lib/types";
import { formatCnDateTime, toIsoDate } from "@/lib/week";

function isFresh(dataset: Dataset, ttlHours: number): boolean {
  const generated = new Date(dataset.generatedAt).getTime();
  if (Number.isNaN(generated)) return false;
  return Date.now() - generated < ttlHours * 3600 * 1000;
}

function toProject(
  payload: GithubRepoPayload,
  entry: CatalogEntry | null,
  source: ProjectRecord["source"],
  today: string,
  snapshots: ReturnType<typeof loadSnapshotHistory>,
  usedSlugs: Set<string>,
): ProjectRecord {
  const created = new Date(payload.created_at);
  const cutoff = new Date(`${today}T00:00:00.000Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 14);
  const deltas = computeDeltas(
    payload.stargazers_count,
    today,
    snapshots,
    payload.full_name,
  );

  return {
    slug: entry?.slug || slugFromFullName(payload.full_name, usedSlugs),
    id: payload.full_name,
    name: entry?.name || payload.name,
    owner: payload.owner.login,
    ownerAvatar: payload.owner.avatar_url,
    description: payload.description,
    url: payload.html_url,
    homepage: entry?.homepage || payload.homepage,
    stars: payload.stargazers_count,
    forks: payload.forks_count,
    language: payload.language,
    topics: payload.topics ?? [],
    license: payload.license?.spdx_id ?? null,
    createdAt: payload.created_at,
    pushedAt: payload.pushed_at,
    tags: entry?.tags ?? inferTags(payload),
    status: (entry?.status ?? "pending") as ProjectStatus,
    source,
    isNew: created >= cutoff,
    ...deltas,
    history: historyForRepo(snapshots, payload.full_name),
  };
}

async function fetchCatalogRepos(
  fullNames: string[],
  concurrency: number,
): Promise<Map<string, GithubRepoPayload>> {
  const client = createGithubClient();
  const found = new Map<string, GithubRepoPayload>();
  const results = await mapWithConcurrency(
    fullNames,
    concurrency,
    (fullName) => client.getRepo(fullName),
  );

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      found.set(fullNames[index].toLowerCase(), result.value);
      return;
    }
    console.warn(`拉取 ${fullNames[index]} 失败`, result.reason);
  });

  return found;
}

export async function buildDataset(): Promise<Dataset> {
  const config = loadConfig();
  const catalog = loadCatalog();
  const today = toIsoDate(new Date());
  const snapshots = loadSnapshotHistory();
  const usedSlugs = new Set(catalog.map((item) => item.slug).filter(Boolean) as string[]);
  const byName = new Map(
    catalog.map((entry) => [entry.fullName.toLowerCase(), entry]),
  );

  const payloads = await fetchCatalogRepos(
    catalog.map((entry) => entry.fullName),
    config.watchlistConcurrency,
  );

  const projects: ProjectRecord[] = [];
  const stars: Record<string, number> = {};
  const known = new Set<string>();
  const failures: string[] = [];

  for (const entry of catalog) {
    const payload = payloads.get(entry.fullName.toLowerCase());
    if (!payload) {
      failures.push(entry.fullName);
      continue;
    }
    known.add(payload.full_name.toLowerCase());
    const project = toProject(
      payload,
      byName.get(entry.fullName.toLowerCase()) ?? entry,
      "catalog",
      today,
      snapshots,
      usedSlugs,
    );
    projects.push(project);
    stars[project.id] = project.stars;
  }

  if (config.discoveryEnabled) {
    const client = createGithubClient();
    const discovered = await discoverRepos(client, known);
    for (const payload of discovered) {
      const project = toProject(
        payload,
        null,
        "discovery",
        today,
        snapshots,
        usedSlugs,
      );
      projects.push(project);
      stars[project.id] = project.stars;
    }
  }

  saveDailySnapshot({
    date: today,
    capturedAt: new Date().toISOString(),
    stars,
  });

  const history = loadSnapshotHistory();
  for (const project of projects) {
    const next = computeDeltas(project.stars, today, history, project.id);
    project.delta = next.delta;
    project.deltaWindow = next.deltaWindow;
    project.history = historyForRepo(history, project.id);
  }

  projects.sort((a, b) => {
    const wa = a.delta.weekly ?? -1;
    const wb = b.delta.weekly ?? -1;
    if (wb !== wa) return wb - wa;
    return b.stars - a.stars;
  });

  const status = publicConfigStatus();
  const notes: string[] = [];
  if (!status.hasToken) {
    notes.push(
      "尚未配置 Fine-grained PAT，当前按未认证限额请求 GitHub。请在设置页查看配置方法。",
    );
  } else if (status.authKind === "fine-grained") {
    notes.push(`已使用 Fine-grained PAT（${status.tokenMasked}）。`);
  } else if (status.authKind === "classic") {
    notes.push(
      `检测到 classic PAT（${status.tokenMasked}）。推荐改用 Fine-grained PAT。`,
    );
  }
  if (history.length < 2) {
    notes.push("快照还不足两天，日/周/月涨幅会在积累后显示。");
  }
  if (failures.length) {
    notes.push(`有 ${failures.length} 个观察名单仓库拉取失败。`);
  }

  const dataset: Dataset = {
    generatedAt: new Date().toISOString(),
    source: "live",
    hasToken: status.hasToken,
    note: notes.join(" "),
    projects,
  };
  saveDataset(dataset);
  return dataset;
}

export async function getCachedDataset(): Promise<Dataset | null> {
  return loadDataset();
}

export async function getOrBuildDataset(force = false): Promise<Dataset> {
  const config = loadConfig();
  const cached = loadDataset();
  if (!force && cached && isFresh(cached, config.cacheTtlHours)) {
    return { ...cached, source: "cache" };
  }
  try {
    return await buildDataset();
  } catch (error) {
    if (cached) {
      return {
        ...cached,
        source: "cache",
        note: `实时刷新失败，已回退到本地缓存。${error instanceof Error ? error.message : ""} ${cached.note}`,
      };
    }
    throw error;
  }
}

export function toWeeklyMarkdown(dataset: Dataset): string {
  const ranked = [...dataset.projects].sort((a, b) => {
    const wa = a.delta.weekly ?? -1;
    const wb = b.delta.weekly ?? -1;
    if (wb !== wa) return wb - wa;
    return b.stars - a.stars;
  });

  const lines = [
    `# QA Pulse · 本周涨星榜`,
    "",
    `> 生成于 ${formatCnDateTime(dataset.generatedAt)}`,
    "",
    dataset.note || "",
    "",
    "| 排名 | 项目 | 本周+ | 总星 | 分类 | 说明 |",
    "| --- | --- | ---: | ---: | --- | --- |",
  ];

  ranked.forEach((project, index) => {
    const growth =
      project.delta.weekly == null ? "—" : `+${project.delta.weekly}`;
    const tags = project.tags.join(", ");
    const desc = (project.description ?? "").replace(/\|/g, "\\|").slice(0, 80);
    lines.push(
      `| ${index + 1} | [${project.id}](${project.url}) | ${growth} | ${project.stars} | ${tags} | ${desc} |`,
    );
  });

  return `${lines.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n")}\n`;
}
