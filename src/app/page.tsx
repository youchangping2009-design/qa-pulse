import type { ReactNode } from "react";
import Link from "next/link";
import { PageShell } from "@/components/site-header";
import { ProjectRow } from "@/components/project-row";
import { RefreshBar } from "@/components/refresh-bar";
import { Badge } from "@/components/ui/badge";
import { publicConfigStatus } from "@/lib/config";
import { getCachedDataset } from "@/lib/build";
import {
  excludeMarkedProjects,
  loadProjectMarks,
} from "@/lib/project-marks";
import { TAG_LABELS } from "@/lib/labels";
import { sortProjects, tagCounts } from "@/lib/sort";
import { TAGS, type ProjectRecord, type TrendPeriod } from "@/lib/types";
import { formatCnDateTime } from "@/lib/week";

export const dynamic = "force-dynamic";

function topBy(projects: ProjectRecord[], period: TrendPeriod, limit: number) {
  return [...projects]
    .filter((project) => project.status !== "deprecated")
    .sort((a, b) => (b.delta[period] ?? -1) - (a.delta[period] ?? -1))
    .slice(0, limit);
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        <Link
          href={href}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          查看全部
        </Link>
      </div>
      {children}
    </section>
  );
}

function firstParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [dataset, config] = await Promise.all([
    getCachedDataset(),
    Promise.resolve(publicConfigStatus()),
  ]);
  const allProjects = dataset?.projects ?? [];
  const projects = excludeMarkedProjects(allProjects, loadProjectMarks());
  const counts = tagCounts(projects);
  const newest = sortProjects(projects, "newest").slice(0, 5);
  const flash = firstParam(params.refreshed)
    ? "ok"
    : firstParam(params.refreshError)
      ? "error"
      : null;

  return (
    <PageShell>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-wide text-emerald-800">
            测试工程师开源目录
          </p>
          <h1 className="font-heading mt-2 text-3xl leading-tight font-semibold sm:text-4xl">
            QA Pulse
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            策展 GitHub 上与测试工程相关的优秀项目，按日 / 周 / 月星标涨幅看趋势。名单覆盖 E2E、API、性能、移动端、平台报告、AI 测试、视觉对比和安全测试。
          </p>
          {dataset ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {projects.length} 个项目 · 更新于 {formatCnDateTime(dataset.generatedAt)}
            </p>
          ) : null}
        </div>
      </div>

      <RefreshBar
        initialConfig={{
          hasToken: config.hasToken,
          authKind: config.authKind,
          tokenMasked: config.tokenMasked,
          localConfigExists: config.localConfigExists,
          configRelPath: config.configRelPath,
        }}
        note={dataset?.note}
        flash={flash}
      />

      {allProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
          还没有本地数据。配置 Fine-grained PAT 后点击「刷新数据」，或运行{" "}
          <code className="font-mono text-xs">npm run snapshot</code>。
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
          所有项目都已标记，可前往{" "}
          <Link href="/marks" className="underline underline-offset-4">
            我的标记
          </Link>{" "}
          查看或恢复。
        </div>
      ) : (
        <>
          <Section title="今日最热" href="/trends/daily">
            <ul className="flex flex-col gap-3">
              {topBy(projects, "daily", 5).map((project, index) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  rank={index + 1}
                  period="daily"
                />
              ))}
            </ul>
          </Section>

          <Section title="本周涨星" href="/trends/weekly">
            <ul className="flex flex-col gap-3">
              {topBy(projects, "weekly", 8).map((project, index) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  rank={index + 1}
                  period="weekly"
                />
              ))}
            </ul>
          </Section>

          <Section title="本月涨星" href="/trends/monthly">
            <ul className="flex flex-col gap-3">
              {topBy(projects, "monthly", 5).map((project, index) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  rank={index + 1}
                  period="monthly"
                />
              ))}
            </ul>
          </Section>

          <Section title="常用分类" href="/tags">
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <Link key={tag} href={`/tags/${tag}`}>
                  <Badge variant="secondary" className="px-3 py-1.5">
                    {TAG_LABELS[tag]} · {counts.get(tag) ?? 0}
                  </Badge>
                </Link>
              ))}
            </div>
          </Section>

          <Section title="最近加入" href="/projects">
            <ul className="flex flex-col gap-3">
              {newest.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </ul>
          </Section>
        </>
      )}
    </PageShell>
  );
}
