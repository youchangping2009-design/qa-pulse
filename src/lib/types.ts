export const CATEGORIES = [
  "e2e",
  "api",
  "performance",
  "unit",
  "mobile",
  "platform",
  "ai",
  "contract",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type GrowthSource =
  | "snapshot"
  | "stargazers"
  | "new-repo"
  | "pending-snapshot"
  | "intra-week";

export type RepoSource = "watchlist" | "discovery";

export type RepoRecord = {
  id: string;
  name: string;
  owner: string;
  ownerAvatar: string | null;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  license: string | null;
  createdAt: string;
  pushedAt: string | null;
  homepage: string | null;
  categories: Category[];
  source: RepoSource;
  isNewThisWeek: boolean;
  starsThisWeek: number | null;
  starsThisWeekCapped: boolean;
  growthSource: GrowthSource;
};

export type Digest = {
  weekId: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  source: "live" | "cache" | "seed";
  hasToken: boolean;
  note: string;
  highlights: {
    fastest: string | null;
    newcomer: string | null;
    mostStarred: string | null;
  };
  repos: RepoRecord[];
};

export type Snapshot = {
  weekId: string;
  capturedAt: string;
  stars: Record<string, number>;
};

export type CatalogEntry = {
  fullName: string;
  categories: Category[];
};
