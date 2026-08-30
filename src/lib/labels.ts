import type { DeltaWindow, SortKey, Tag, TrendPeriod } from "@/lib/types";

export const TAG_LABELS: Record<Tag, string> = {
  e2e: "E2E / UI",
  api: "API 测试",
  performance: "性能测试",
  unit: "单元 / 集成",
  mobile: "移动端",
  platform: "平台 / 报告",
  ai: "AI 测试",
  contract: "Mock / 契约",
  visual: "视觉 / 无障碍",
  security: "安全测试",
};

export const PERIOD_LABELS: Record<TrendPeriod, string> = {
  daily: "今日",
  weekly: "本周",
  monthly: "本月",
};

export const SORT_LABELS: Record<SortKey, string> = {
  trending: "本周涨星",
  stars: "总星标",
  updated: "最近更新",
  newest: "最新加入",
};

export const WINDOW_LABELS: Record<DeltaWindow, string> = {
  full: "完整窗口",
  partial: "窗口不足，对比最近快照",
  missing: "等待快照",
};
