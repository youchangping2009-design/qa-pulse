import { loadConfig } from "@/lib/config";
import type { Category } from "@/lib/types";

export type GithubRepoPayload = {
  full_name: string;
  name: string;
  owner: { login: string; avatar_url: string };
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics?: string[];
  license: { spdx_id: string } | null;
  created_at: string;
  pushed_at: string | null;
  homepage: string | null;
};

export class GithubHttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  accept?: string;
};

export type GithubClient = {
  hasToken: boolean;
  getRepo: (fullName: string) => Promise<GithubRepoPayload>;
  searchRepos: (query: string, perPage?: number) => Promise<GithubRepoPayload[]>;
  rateLimit: () => Promise<{ core: number; search: number }>;
};

async function githubFetch(
  pathOrUrl: string,
  options: RequestOptions = {},
): Promise<Response> {
  const config = loadConfig();
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${config.apiBaseUrl}${pathOrUrl}`;
  const headers: Record<string, string> = {
    Accept: options.accept ?? "application/vnd.github+json",
    "User-Agent": config.userAgent,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }
  const response = await fetch(url, { headers, cache: "no-store" });
  return response;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    let message = text.slice(0, 300);
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      /* 保持原文 */
    }
    throw new GithubHttpError(
      `GitHub API ${response.status}: ${message}`,
      response.status,
    );
  }
  return JSON.parse(text) as T;
}

export function createGithubClient(): GithubClient {
  const config = loadConfig();

  return {
    hasToken: Boolean(config.token),

    async getRepo(fullName: string) {
      const response = await githubFetch(`/repos/${fullName}`);
      return readJson<GithubRepoPayload>(response);
    },

    async searchRepos(query: string, perPage = 20) {
      const params = new URLSearchParams({
        q: query,
        per_page: String(perPage),
        sort: "stars",
        order: "desc",
      });
      const response = await githubFetch(`/search/repositories?${params}`);
      const data = await readJson<{ items?: GithubRepoPayload[] }>(response);
      return data.items ?? [];
    },

    async rateLimit() {
      const response = await githubFetch("/rate_limit");
      const data = await readJson<{
        resources: { core: { remaining: number }; search: { remaining: number } };
      }>(response);
      return {
        core: data.resources.core.remaining,
        search: data.resources.search.remaining,
      };
    },
  };
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      try {
        const value = await mapper(items[index], index);
        results[index] = { status: "fulfilled", value };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, limit) }, () => worker());
  await Promise.all(workers);
  return results;
}

export const CATEGORY_HINTS: Record<Category, string[]> = {
  e2e: ["playwright", "cypress", "selenium", "e2e", "webdriver", "puppeteer", "testcafe"],
  api: ["api", "rest", "http", "graphql", "karate", "bruno", "hurl", "keploy"],
  performance: ["k6", "jmeter", "locust", "gatling", "load", "performance", "artillery"],
  unit: ["unit", "pytest", "jest", "vitest", "junit", "testcontainer", "mockito"],
  mobile: ["appium", "android", "ios", "mobile", "maestro", "detox", "airtest"],
  platform: ["allure", "report", "platform", "dashboard", "metersphere"],
  ai: ["ai", "agent", "llm", "mcp", "midscene", "stagehand"],
  contract: ["mock", "wiremock", "pact", "msw", "mockoon", "contract"],
};
