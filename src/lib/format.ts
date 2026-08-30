import type { ProjectRecord } from "@/lib/types";

export function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export function formatDelta(value: number | null): string {
  if (value == null) return "—";
  return `+${value}`;
}

export function findProject(
  projects: ProjectRecord[],
  slug: string,
): ProjectRecord | undefined {
  return projects.find((project) => project.slug === slug);
}
