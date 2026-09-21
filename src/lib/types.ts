export const TAGS = [
  "e2e",
  "api",
  "performance",
  "unit",
  "mobile",
  "platform",
  "ai",
  "contract",
  "visual",
  "security",
] as const;

export type Tag = (typeof TAGS)[number];

/** 兼容旧名称，页面与流水线统一用 Tag。 */
export type Category = Tag;

export const PROJECT_STATUSES = [
  "active",
  "featured",
  "deprecated",
  "pending",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectSource = "catalog" | "discovery";

export type DeltaWindow = "full" | "partial" | "missing";

export type TrendPeriod = "daily" | "weekly" | "monthly";

export const PROJECT_MARK_STATES = [
  "understood",
  "learned",
  "ignored",
] as const;

export type ProjectMarkState = (typeof PROJECT_MARK_STATES)[number];

export type ProjectMark = {
  state: ProjectMarkState;
  updatedAt: string;
};

export type ProjectMarks = Record<string, ProjectMark>;

export type CatalogEntry = {
  fullName: string;
  tags: Tag[];
  status?: ProjectStatus;
  slug?: string;
  name?: string;
  homepage?: string;
};

export type StarHistoryPoint = {
  date: string;
  stars: number;
};

export type ProjectRecord = {
  slug: string;
  id: string;
  name: string;
  owner: string;
  ownerAvatar: string | null;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  license: string | null;
  createdAt: string;
  pushedAt: string | null;
  tags: Tag[];
  status: ProjectStatus;
  source: ProjectSource;
  isNew: boolean;
  delta: {
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
  };
  deltaWindow: {
    daily: DeltaWindow;
    weekly: DeltaWindow;
    monthly: DeltaWindow;
  };
  history: StarHistoryPoint[];
};

export type DailySnapshot = {
  date: string;
  capturedAt: string;
  stars: Record<string, number>;
};

export type Dataset = {
  generatedAt: string;
  source: "live" | "cache";
  hasToken: boolean;
  note: string;
  projects: ProjectRecord[];
};

export type SortKey = "trending" | "stars" | "updated" | "newest";

export type ConfigStatus = {
  hasToken: boolean;
  authKind: "none" | "fine-grained" | "classic" | "other";
  tokenMasked: string | null;
  localConfigExists: boolean;
  configRelPath: string;
};
