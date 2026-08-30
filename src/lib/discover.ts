import { readFileSync } from "node:fs";
import path from "node:path";
import { createGithubClient, type GithubRepoPayload } from "@/lib/github";
import { isRelevantTestingRepo } from "@/lib/relevance";
import { toIsoDate } from "@/lib/week";

type DiscoveryFile = {
  minStars?: number;
  lookbackDays?: number;
  queries?: string[];
};

export function loadDiscoveryConfig(): Required<DiscoveryFile> {
  const file = path.join(process.cwd(), "data", "discovery.json");
  const parsed = JSON.parse(readFileSync(file, "utf8")) as DiscoveryFile;
  return {
    minStars: parsed.minStars ?? 5,
    lookbackDays: parsed.lookbackDays ?? 14,
    queries: parsed.queries ?? [
      "created:>=${since} topic:testing stars:>=${minStars}",
    ],
  };
}

function fillQuery(
  template: string,
  since: string,
  minStars: number,
): string {
  return template
    .replaceAll("${since}", since)
    .replaceAll("${minStars}", String(minStars));
}

export async function discoverRepos(
  client: ReturnType<typeof createGithubClient>,
  known: Set<string>,
): Promise<GithubRepoPayload[]> {
  const config = loadDiscoveryConfig();
  const sinceDate = new Date();
  sinceDate.setUTCDate(sinceDate.getUTCDate() - config.lookbackDays);
  const since = toIsoDate(sinceDate);
  const found = new Map<string, GithubRepoPayload>();

  for (const template of config.queries) {
    const query = fillQuery(template, since, config.minStars);
    try {
      const items = await client.searchRepos(query, 20);
      for (const item of items) {
        if (known.has(item.full_name.toLowerCase())) continue;
        if (!isRelevantTestingRepo(item)) continue;
        found.set(item.full_name.toLowerCase(), item);
      }
    } catch (error) {
      console.warn("发现新仓失败：", error);
    }
  }

  return [...found.values()];
}
