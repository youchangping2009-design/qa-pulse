import { notFound } from "next/navigation";
import { PageShell } from "@/components/site-header";
import { ProjectRow } from "@/components/project-row";
import { getCachedDataset } from "@/lib/build";
import { TAG_LABELS } from "@/lib/labels";
import { filterProjects, sortProjects } from "@/lib/sort";
import { TAGS, type Tag } from "@/lib/types";

export const dynamic = "force-dynamic";

function isTag(value: string): value is Tag {
  return (TAGS as readonly string[]).includes(value);
}

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!isTag(code)) notFound();

  const dataset = await getCachedDataset();
  const projects = sortProjects(
    filterProjects(dataset?.projects ?? [], "", code),
    "trending",
  );

  return (
    <PageShell>
      <div>
        <h1 className="font-heading text-3xl font-semibold">
          {TAG_LABELS[code]}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {projects.length} 个项目，按本周涨星排序。
        </p>
      </div>
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
          这个分类还没有项目。
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((project, index) => (
            <ProjectRow key={project.id} project={project} rank={index + 1} />
          ))}
        </ul>
      )}
    </PageShell>
  );
}
