import type { GithubRepoPayload } from "@/lib/github";
import { TAG_HINTS } from "@/lib/tag-hints";
import type { Tag } from "@/lib/types";

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
  "fuzz",
  "visual regression",
  "axe-core",
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
  "visual-testing",
  "accessibility",
  "fuzzing",
  "dast",
]);

function blobOf(repo: GithubRepoPayload): string {
  return [repo.full_name, repo.description ?? "", ...(repo.topics ?? [])]
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

export function inferTags(repo: GithubRepoPayload): Tag[] {
  const blob = blobOf(repo);
  const tags: Tag[] = [];
  for (const [tag, keys] of Object.entries(TAG_HINTS) as [Tag, string[]][]) {
    if (keys.some((key) => blob.includes(key))) tags.push(tag);
  }
  return tags.length ? tags : ["e2e"];
}
