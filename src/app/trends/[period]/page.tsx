import { notFound } from "next/navigation";
import { PageShell } from "@/components/site-header";
import { ProjectRow } from "@/components/project-row";
import { getCachedDataset } from "@/lib/build";
import { PERIOD_LABELS } from "@/lib/labels";
import {
  excludeMarkedProjects,
  loadProjectMarks,
} from "@/lib/project-marks";
import type { TrendPeriod } from "@/lib/types";
import { formatCnDateTime } from "@/lib/week";

export const dynamic = "force-dynamic";

const PERIODS = ["daily", "weekly", "monthly"] as const;

const PERIOD_SNAPSHOT_LABELS: Record<TrendPeriod, string> = {
  daily: "每日",
  weekly: "每周",
  monthly: "每月",
};

function isPeriod(value: string): value is TrendPeriod {
  return (PERIODS as readonly string[]).includes(value);
}

export default async function TrendsPage({
  params,
}: {
  params: Promise<{ period: string }>;
}) {
  const { period } = await params;
  if (!isPeriod(period)) notFound();

  const dataset = await getCachedDataset();
  const projects = excludeMarkedProjects(
    dataset?.projects ?? [],
    loadProjectMarks(),
  )
    .filter((project) => project.status !== "deprecated")
    .sort((a, b) => (b.delta[period] ?? -1) - (a.delta[period] ?? -1));

  return (
    <PageShell>
      <div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-heading text-3xl font-semibold">
            {PERIOD_LABELS[period]}涨星榜
          </h1>
          {dataset ? (
            <p className="text-sm text-muted-foreground">
              更新于 {formatCnDateTime(dataset.generatedAt)}
            </p>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          由{PERIOD_SNAPSHOT_LABELS[period]}星标快照对比得出。没有对应日期的快照时会回退到最近一次记录。
        </p>
      </div>
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
          当前没有可展示的项目。
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((project, index) => (
            <ProjectRow
              key={project.id}
              project={project}
              rank={index + 1}
              period={period}
            />
          ))}
        </ul>
      )}
    </PageShell>
  );
}
