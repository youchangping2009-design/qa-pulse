import Link from "next/link";
import { ProjectMarkControl } from "@/components/project-mark-control";
import { Badge } from "@/components/ui/badge";
import { formatDelta, formatStars } from "@/lib/format";
import { PROJECT_MARK_LABELS, TAG_LABELS } from "@/lib/labels";
import type {
  ProjectMarkState,
  ProjectRecord,
  TrendPeriod,
} from "@/lib/types";

export function ProjectRow({
  project,
  rank,
  period = "weekly",
  markState = null,
}: {
  project: ProjectRecord;
  rank?: number;
  period?: TrendPeriod;
  markState?: ProjectMarkState | null;
}) {
  const growth = formatDelta(project.delta[period]);
  return (
    <li className="rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center justify-between gap-2 sm:w-20 sm:flex-col sm:items-start sm:justify-start">
          {rank != null ? (
            <span className="font-heading text-lg font-semibold text-muted-foreground">
              {String(rank).padStart(2, "0")}
            </span>
          ) : null}
          <ProjectMarkControl
            projectId={project.id}
            initialState={markState}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:underline"
            >
              {project.id}
            </a>
            {project.status === "featured" ? (
              <Badge>精选</Badge>
            ) : null}
            {project.source === "discovery" ? (
              <Badge variant="outline">新发现</Badge>
            ) : null}
            {project.isNew ? <Badge variant="secondary">近期新建</Badge> : null}
            {project.language ? (
              <Badge variant="outline">{project.language}</Badge>
            ) : null}
            {markState ? (
              <Badge variant="outline">{PROJECT_MARK_LABELS[markState]}</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {project.description || "暂无描述"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <Link key={tag} href={`/tags/${tag}`}>
                <Badge variant="secondary">{TAG_LABELS[tag]}</Badge>
              </Link>
            ))}
          </div>
        </div>
        <Link
          href={`/projects/${project.slug}`}
          aria-label={`查看 ${project.id} 详情`}
          className="group flex shrink-0 items-end justify-between gap-6 rounded-lg sm:min-w-28 sm:flex-col sm:items-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {period === "daily"
                ? "今日涨星"
                : period === "monthly"
                  ? "本月涨星"
                  : "本周涨星"}
            </p>
            <p className="font-heading text-2xl font-semibold text-emerald-800 group-hover:underline">
              {growth}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatStars(project.stars)} stars
          </p>
        </Link>
      </div>
    </li>
  );
}
