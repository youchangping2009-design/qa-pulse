import { PageShell } from "@/components/site-header";
import { ProjectRow } from "@/components/project-row";
import { ProjectsToolbar } from "@/components/projects-toolbar";
import { getCachedDataset } from "@/lib/build";
import {
  excludeMarkedProjects,
  loadProjectMarks,
} from "@/lib/project-marks";
import { filterProjects, sortProjects } from "@/lib/sort";
import type { SortKey } from "@/lib/types";
import { formatCnDateTime } from "@/lib/week";

export const dynamic = "force-dynamic";

const SORTS: SortKey[] = ["trending", "stars", "updated", "newest"];

function firstString(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseSort(value: string): SortKey {
  return SORTS.includes(value as SortKey) ? (value as SortKey) : "trending";
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = firstString(params.q);
  const sort = parseSort(firstString(params.sort));
  const dataset = await getCachedDataset();
  const visibleProjects = excludeMarkedProjects(
    dataset?.projects ?? [],
    loadProjectMarks(),
  );
  const projects = sortProjects(
    filterProjects(visibleProjects, query, "all"),
    sort,
  );

  return (
    <PageShell>
      <div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-heading text-3xl font-semibold">全部项目</h1>
          {dataset ? (
            <p className="text-sm text-muted-foreground">
              更新于 {formatCnDateTime(dataset.generatedAt)}
            </p>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {projects.length} 个测试相关仓库，按本周涨星、总星标或最近更新排序。
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <ProjectsToolbar query={query} sort={sort} />
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
            没有符合筛选条件的项目。
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {projects.map((project, index) => (
              <ProjectRow key={project.id} project={project} rank={index + 1} />
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
