import type { Category } from "@/lib/types";
import { CATEGORY_HINTS } from "@/lib/github";
import type { GithubRepoPayload } from "@/lib/github";

const RELEVANT_KEYWORDS = [
  "test",
  "testing",
  "e2e",
  "qa",
  "quality assurance",
  "playwright",
  "cypress",
  "selenium",
  "pytest",
  "junit",
  "testng",
  "appium",
  "jmeter",
  "k6",
  "locust",
  "gatling",
  "mock",
  "coverage",
  "allure",
  "webdriver",
  "assert",
  "automation",
  "testcontainer",
  "maestro",
  "detox",
];

const EXCLUDE_KEYWORDS = [
  "job applier",
  "resume",
  "leetcode",
  "crypto faucet",
  "vpn",
  "bypass discord",
  "hentai",
  "nsfw",
];

const TOPIC_ALLOW = new Set([
  "testing",
  "test-automation",
  "e2e-testing",
  "e2e",
  "playwright",
  "cypress",
  "selenium",
  "pytest",
  "appium",
  "qa",
  "quality-assurance",
  "api-testing",
  "performance-testing",
  "load-testing",
  "unit-testing",
  "contract-testing",
  "mocking",
]);

function blobOf(repo: GithubRepoPayload): string {
  return [
    repo.full_name,
    repo.description ?? "",
    ...(repo.topics ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

export function isRelevantTestingRepo(repo: GithubRepoPayload): boolean {
  const blob = blobOf(repo);
  if (EXCLUDE_KEYWORDS.some((word) => blob.includes(word))) return false;
  const topics = new Set((repo.topics ?? []).map((t) => t.toLowerCase()));
  for (const topic of topics) {
    if (TOPIC_ALLOW.has(topic)) return true;
  }
  return RELEVANT_KEYWORDS.some((word) => blob.includes(word));
}

export function inferCategories(repo: GithubRepoPayload): Category[] {
  const blob = blobOf(repo);
  const cats: Category[] = [];
  for (const [category, keys] of Object.entries(CATEGORY_HINTS) as [
    Category,
    string[],
  ][]) {
    if (keys.some((key) => blob.includes(key))) cats.push(category);
  }
  return cats.length ? cats : ["e2e"];
}
