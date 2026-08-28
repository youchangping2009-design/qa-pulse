import { readFileSync } from "node:fs";
import path from "node:path";
import { loadConfig, publicConfigStatus } from "@/lib/config";
import { createGithubClient, type GithubRepoPayload } from "@/lib/github";
import { inferCategories, isRelevantTestingRepo } from "@/lib/relevance";
import {
  loadLatestDigest,
  loadSnapshot,
  saveDigest,
  saveLatestSnapshot,
  saveWeekBaseline,
} from "@/lib/store";
import type {
  CatalogEntry,
  Category,
  Digest,
  GrowthSource,
  RepoRecord,
  Snapshot,
} from "@/lib/types";
import { getWeekRange, previousWeekId } from "@/lib/week";

function loadCatalog(): CatalogEntry[] {
  const file = path.join(process.cwd(), "data", "catalog.json");
  const parsed = JSON.parse(readFileSync(file, "utf8")) as {
    repos: CatalogEntry[];
  };
  return parsed.repos;
}

function toRecord(
  payload: GithubRepoPayload,
  categories: Category[],
  source: RepoRecord["source"],
): Omit<
  RepoRecord,
  "isNewThisWeek" | "starsThisWeek" | "starsThisWeekCapped" | "growthSource"
> {
  return {
    id: payload.full_name,
    name: payload.name,
    owner: payload.owner.login,
    ownerAvatar: payload.owner.avatar_url,
    description: payload.description,
    url: payload.html_url,
    stars: payload.stargazers_count,
    forks: payload.forks_count,
    language: payload.language,
    topics: payload.topics ?? [],
    license: payload.license?.spdx_id ?? null,
    createdAt: payload.created_at,
    pushedAt: payload.pushed_at,
    homepage: payload.homepage,
    categories,
    source,
  };
}

function applyGrowth(
  repo: Omit<
    RepoRecord,
    "isNewThisWeek" | "starsThisWeek" | "starsThisWeekCapped" | "growthSource"
  >,
  weekStart: string,
  prev: Snapshot | null,
  baseline: Snapshot | null,
): RepoRecord {
  const created = new Date(repo.createdAt);
  const isNewThisWeek = created >= new Date(`${weekStart}T00:00:00.000Z`);
  const prevStars = prev?.stars[repo.id];
  const baseStars = baseline?.stars[repo.id];

  let starsThisWeek: number | null = null;
  let growthSource: GrowthSource = "pending-snapshot";

  if (typeof prevStars === "number") {
    starsThisWeek = Math.max(0, repo.stars - prevStars);
    growthSource = "snapshot";
  } else if (typeof baseStars === "number") {
    starsThisWeek = Math.max(0, repo.stars - baseStars);
    growthSource = "intra-week";
  } else if (isNewThisWeek) {
    starsThisWeek = repo.stars;
    growthSource = "new-repo";
  }

  return {
    ...repo,
    isNewThisWeek,
    starsThisWeek,
    starsThisWeekCapped: false,
    growthSource,
  };
}

function pickHighlights(repos: RepoRecord[]): Digest["highlights"] {
  const withGrowth = repos.filter((r) => (r.starsThisWeek ?? 0) > 0);
  const newcomers = repos.filter((r) => r.isNewThisWeek);
  return {
    fastest: withGrowth[0]?.id ?? null,
    newcomer: newcomers[0]?.id ?? null,
    mostStarred:
      repos.slice().sort((a, b) => b.stars - a.stars)[0]?.id ?? null,
  };
}

async function fetchWatchlist(
  client: ReturnType<typeof createGithubClient>,
  fullNames: string[],
): Promise<Map<string, GithubRepoPayload>> {
  const found = new Map<string, GithubRepoPayload>();
  for (let i = 0; i < fullNames.length; i += 5) {
    const batch = fullNames.slice(i, i + 5);
    const query = batch.map((name) => `repo:${name}`).join(" ");
    try {
      const items = await client.searchRepos(query, 5);
      for (const item of items) {
        found.set(item.full_name.toLowerCase(), item);
      }
    } catch (error) {
      console.warn("观察名单搜索失败，回退到逐个 GET：", error);
      for (const name of batch) {
        try {
          const item = await client.getRepo(name);
          found.set(item.full_name.toLowerCase(), item);
        } catch (inner) {
          console.warn(`拉取 ${name} 失败`, inner);
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  return found;
}

async function discoverRepos(
  client: ReturnType<typeof createGithubClient>,
  weekStart: string,
  known: Set<string>,
): Promise<GithubRepoPayload[]> {
  const queries = [
    `created:>=${weekStart} playwright stars:>=5`,
    `created:>=${weekStart} topic:testing stars:>=5`,
  ];
  const found = new Map<string, GithubRepoPayload>();
  for (const query of queries) {
    try {
      const items = await client.searchRepos(query, 20);
      for (const item of items) {
        if (known.has(item.full_name)) continue;
        if (!isRelevantTestingRepo(item)) continue;
        found.set(item.full_name, item);
      }
    } catch (error) {
      console.warn("发现新仓失败：", error);
    }
  }
  return [...found.values()];
}

export function digestIsFresh(digest: Digest, ttlHours: number): boolean {
  const generated = new Date(digest.generatedAt).getTime();
  if (Number.isNaN(generated)) return false;
  return Date.now() - generated < ttlHours * 3600 * 1000;
}

export async function getCachedDigest(): Promise<Digest | null> {
  return loadLatestDigest();
}

export async function buildDigest(): Promise<Digest> {
  const config = loadConfig();
  const week = getWeekRange();
  const catalog = loadCatalog();
  const client = createGithubClient();
  const prev = loadSnapshot(previousWeekId(week.weekId));
  const baseline = loadSnapshot(week.weekId);

  const categoryById = new Map(
    catalog.map((entry) => [entry.fullName.toLowerCase(), entry.categories]),
  );
  const payloads = await fetchWatchlist(client, catalog.map((e) => e.fullName));
  const failures: string[] = [];
  const records: RepoRecord[] = [];
  const stars: Record<string, number> = {};
  const known = new Set<string>();

  for (const fullName of catalog.map((e) => e.fullName)) {
    const payload = payloads.get(fullName.toLowerCase());
    if (!payload) {
      failures.push(fullName);
      continue;
    }
    known.add(payload.full_name);
    const record = applyGrowth(
      toRecord(
        payload,
        categoryById.get(fullName.toLowerCase()) ?? inferCategories(payload),
        "watchlist",
      ),
      week.weekStart,
      prev,
      baseline,
    );
    records.push(record);
    stars[record.id] = record.stars;
  }

  if (config.discoveryEnabled) {
    const discovered = await discoverRepos(client, week.weekStart, known);
    for (const payload of discovered) {
      const record = applyGrowth(
        toRecord(payload, inferCategories(payload), "discovery"),
        week.weekStart,
        prev,
        baseline,
      );
      records.push(record);
      stars[record.id] = record.stars;
    }
  }

  records.sort((a, b) => {
    const ga = a.starsThisWeek ?? -1;
    const gb = b.starsThisWeek ?? -1;
    if (gb !== ga) return gb - ga;
    return b.stars - a.stars;
  });

  const snapshot: Snapshot = {
    weekId: week.weekId,
    capturedAt: new Date().toISOString(),
    stars,
  };
  saveWeekBaseline(snapshot);
  saveLatestSnapshot(snapshot);

  const status = publicConfigStatus();
  const notes: string[] = [];
  if (!status.hasToken) {
    notes.push(
      "尚未配置 Fine-grained PAT，当前按未认证限额请求 GitHub。复制 config/github.example.json 为 config/github.local.json 并填入 token。",
    );
  } else if (status.authKind === "fine-grained") {
    notes.push(`已使用 Fine-grained PAT（${status.tokenMasked}）。`);
  } else if (status.authKind === "classic") {
    notes.push(
      `检测到 classic PAT（${status.tokenMasked}）。本项目推荐 Fine-grained PAT，classic 仍可提高限额。`,
    );
  }
  if (!prev) {
    notes.push(
      "还没有上周快照。观察名单的真实周涨幅将从下一周开始计算；本周新仓的星标即本周涨幅。",
    );
  }
  if (failures.length) {
    notes.push(`有 ${failures.length} 个观察名单仓库拉取失败。`);
  }

  const digest: Digest = {
    weekId: week.weekId,
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
    generatedAt: new Date().toISOString(),
    source: "live",
    hasToken: status.hasToken,
    note: notes.join(" "),
    highlights: pickHighlights(records),
    repos: records,
  };
  saveDigest(digest);
  return digest;
}

export async function getOrBuildDigest(force = false): Promise<Digest> {
  const config = loadConfig();
  const cached = loadLatestDigest();
  const week = getWeekRange();
  if (
    !force &&
    cached &&
    cached.weekId === week.weekId &&
    digestIsFresh(cached, config.cacheTtlHours)
  ) {
    return { ...cached, source: "cache" };
  }
  try {
    return await buildDigest();
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

export function toMarkdown(digest: Digest): string {
  const lines = [
    `# 测试工程周报 · ${digest.weekId}`,
    "",
    `> ${digest.weekStart} – ${digest.weekEnd}`,
    "",
    digest.note ? `${digest.note}` : "",
    "",
    "## 本周涨星最快",
    "",
    "| 排名 | 项目 | 本周+ | 总星 | 分类 | 说明 |",
    "| --- | --- | ---: | ---: | --- | --- |",
  ];

  digest.repos.forEach((repo, index) => {
    const growth =
      repo.starsThisWeek == null ? "—" : `+${repo.starsThisWeek}`;
    const cats = repo.categories.join(", ");
    const desc = (repo.description ?? "").replace(/\|/g, "\\|").slice(0, 80);
    lines.push(
      `| ${index + 1} | [${repo.id}](${repo.url}) | ${growth} | ${repo.stars} | ${cats} | ${desc} |`,
    );
  });

  return lines.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n") + "\n";
}
