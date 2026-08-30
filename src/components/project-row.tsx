import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDelta, formatStars } from "@/lib/format";
import { TAG_LABELS } from "@/lib/labels";
import type { ProjectRecord, TrendPeriod } from "@/lib/types";

export function ProjectRow({
  project,
  rank,
  period = "weekly",
}: {
  project: ProjectRecord;
  rank?: number;
  period?: TrendPeriod;
}) {
  const growth = formatDelta(project.delta[period]);
  return (
    <li className="rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        {rank != null ? (
          <span className="font-heading w-10 text-lg font-semibold text-muted-foreground">
            {String(rank).padStart(2, "0")}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/projects/${project.slug}`}
              className="font-medium hover:underline"
            >
              {project.id}
            </Link>
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
        <div className="flex shrink-0 items-end justify-between gap-6 sm:min-w-28 sm:flex-col sm:items-end">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {period === "daily"
                ? "今日涨星"
                : period === "monthly"
                  ? "本月涨星"
                  : "本周涨星"}
            </p>
            <p className="font-heading text-2xl font-semibold text-emerald-800">
              {growth}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatStars(project.stars)} stars
          </p>
        </div>
      </div>
    </li>
  );
}
