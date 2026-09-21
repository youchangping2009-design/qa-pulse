import Link from "next/link";
import { PageShell } from "@/components/site-header";
import { ProjectRow } from "@/components/project-row";
import { buttonVariants } from "@/components/ui/button";
import { getCachedDataset } from "@/lib/build";
import { PROJECT_MARK_LABELS } from "@/lib/labels";
import { loadProjectMarks, markForProject } from "@/lib/project-marks";
import {
  PROJECT_MARK_STATES,
  type ProjectMarkState,
  type ProjectRecord,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type MarkFilter = ProjectMarkState | "all";

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseState(value: string): MarkFilter {
  return (PROJECT_MARK_STATES as readonly string[]).includes(value)
    ? (value as ProjectMarkState)
    : "all";
}

function matchesQuery(project: ProjectRecord, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    project.id,
    project.name,
    project.description ?? "",
    project.language ?? "",
    ...project.topics,
    ...project.tags,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function marksHref(state: MarkFilter, query: string): string {
  const params = new URLSearchParams();
  if (state !== "all") params.set("state", state);
  if (query.trim()) params.set("q", query.trim());
  const search = params.toString();
  return search ? `/marks?${search}` : "/marks";
}

export default async function MarksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const state = parseState(firstString(params.state));
  const query = firstString(params.q);
  const dataset = await getCachedDataset();
  const marks = loadProjectMarks();

  const markedProjects = (dataset?.projects ?? [])
    .map((project) => ({ project, mark: markForProject(marks, project.id) }))
    .filter(
      (
        item,
      ): item is {
        project: ProjectRecord;
        mark: NonNullable<typeof item.mark>;
      } => item.mark != null,
    );

  const counts = Object.fromEntries(
    PROJECT_MARK_STATES.map((value) => [
      value,
      markedProjects.filter((item) => item.mark.state === value).length,
    ]),
  ) as Record<ProjectMarkState, number>;

  const projects = markedProjects
    .filter((item) => state === "all" || item.mark.state === state)
    .filter((item) => matchesQuery(item.project, query))
    .sort((a, b) => b.mark.updatedAt.localeCompare(a.mark.updatedAt));

  const filters: Array<{ value: MarkFilter; label: string; count: number }> = [
    { value: "all", label: "全部", count: markedProjects.length },
    ...PROJECT_MARK_STATES.map((value) => ({
      value,
      label: PROJECT_MARK_LABELS[value],
      count: counts[value],
    })),
  ];

  return (
    <PageShell>
      <div>
        <h1 className="font-heading text-3xl font-semibold">我的标记</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          已标记 {markedProjects.length} 个项目。这些项目不再出现在常规列表和榜单中。
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1">
          {filters.map((filter) => (
            <Link
              key={filter.value}
              href={marksHref(filter.value, query)}
              scroll={false}
              className={buttonVariants({
                size: "sm",
                variant: state === filter.value ? "default" : "outline",
              })}
            >
              {filter.label} · {filter.count}
            </Link>
          ))}
        </div>

        <form action="/marks" method="get" className="flex max-w-md gap-2">
          {state !== "all" ? (
            <input type="hidden" name="state" value={state} />
          ) : null}
          <input
            name="q"
            defaultValue={query}
            placeholder="搜索已标记项目"
            className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button type="submit" className={buttonVariants({ size: "sm" })}>
            搜索
          </button>
        </form>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
          {markedProjects.length === 0
            ? "还没有标记项目。可以在项目卡片或详情页中添加标记。"
            : "没有符合当前条件的项目。"}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map(({ project, mark }, index) => (
            <ProjectRow
              key={project.id}
              project={project}
              rank={index + 1}
              markState={mark.state}
            />
          ))}
        </ul>
      )}
    </PageShell>
  );
}
