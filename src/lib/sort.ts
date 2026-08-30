import type { ProjectRecord, SortKey, Tag, TrendPeriod } from "@/lib/types";

export function deltaOf(
  project: ProjectRecord,
  period: TrendPeriod,
): number | null {
  return project.delta[period];
}

export function sortProjects(
  projects: ProjectRecord[],
  sort: SortKey,
): ProjectRecord[] {
  return [...projects].sort((a, b) => {
    if (sort === "stars") return b.stars - a.stars;
    if (sort === "updated") {
      return (b.pushedAt ?? "").localeCompare(a.pushedAt ?? "");
    }
    if (sort === "newest") {
      return b.createdAt.localeCompare(a.createdAt);
    }
    const wa = a.delta.weekly ?? -1;
    const wb = b.delta.weekly ?? -1;
    if (wb !== wa) return wb - wa;
    return b.stars - a.stars;
  });
}

export function filterProjects(
  projects: ProjectRecord[],
  query: string,
  tag: Tag | "all",
): ProjectRecord[] {
  const q = query.trim().toLowerCase();
  return projects.filter((project) => {
    if (project.status === "deprecated") return false;
    if (tag !== "all" && !project.tags.includes(tag)) return false;
    if (!q) return true;
    const blob = [
      project.id,
      project.name,
      project.description ?? "",
      project.language ?? "",
      ...project.topics,
      ...project.tags,
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}

export function tagCounts(projects: ProjectRecord[]): Map<Tag, number> {
  const counts = new Map<Tag, number>();
  for (const project of projects) {
    if (project.status === "deprecated") continue;
    for (const tag of project.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}
