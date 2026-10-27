import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/site-header";
import { ProjectMarkControl } from "@/components/project-mark-control";
import { Sparkline } from "@/components/sparkline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCachedDataset } from "@/lib/build";
import { findProject, formatDelta, formatStars } from "@/lib/format";
import { TAG_LABELS, WINDOW_LABELS } from "@/lib/labels";
import { loadProjectMarks, markForProject } from "@/lib/project-marks";
import { formatCnDate } from "@/lib/week";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dataset = await getCachedDataset();
  const project = findProject(dataset?.projects ?? [], slug);
  if (!project) notFound();
  const mark = markForProject(loadProjectMarks(), project.id);

  return (
    <PageShell>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{project.owner}</p>
        <h1 className="font-heading text-3xl font-semibold">{project.name}</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {project.description || "暂无描述"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <Link key={tag} href={`/tags/${tag}`}>
              <Badge variant="secondary">{TAG_LABELS[tag]}</Badge>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            nativeButton={false}
            render={
              <a href={project.url} target="_blank" rel="noreferrer" />
            }
          >
            GitHub
            <ArrowUpRight />
          </Button>
          {project.homepage ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <a href={project.homepage} target="_blank" rel="noreferrer" />
              }
            >
              主页
              <ArrowUpRight />
            </Button>
          ) : null}
          <ProjectMarkControl
            projectId={project.id}
            initialState={mark?.state ?? null}
          />
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <Stat label="总星标" value={formatStars(project.stars)} />
        <Stat label="本周+" value={formatDelta(project.delta.weekly)} hint={WINDOW_LABELS[project.deltaWindow.weekly]} />
        <Stat label="本月+" value={formatDelta(project.delta.monthly)} hint={WINDOW_LABELS[project.deltaWindow.monthly]} />
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold">星标趋势</h2>
        <Sparkline points={project.history} />
        {project.history.length ? (
          <p className="text-xs text-muted-foreground">
            {formatCnDate(project.history[0].date)} –{" "}
            {formatCnDate(project.history[project.history.length - 1].date)}
          </p>
        ) : null}
      </section>
    </PageShell>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading mt-1 text-2xl font-semibold">{value}</dd>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
