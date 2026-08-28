import type { Category, GrowthSource } from "@/lib/types";

export const CATEGORY_LABELS: Record<Category, string> = {
  e2e: "E2E / UI",
  api: "API 测试",
  performance: "性能测试",
  unit: "单元 / 集成",
  mobile: "移动端",
  platform: "平台 / 报告",
  ai: "AI 测试",
  contract: "Mock / 契约",
};

export const GROWTH_SOURCE_LABELS: Record<GrowthSource, string> = {
  snapshot: "与上周快照对比",
  stargazers: "近 7 天 stargazer（抽样）",
  "new-repo": "本周新建，星标即涨幅",
  "pending-snapshot": "等待下周快照",
  "intra-week": "相对本周首次快照",
};
