import { PageShell } from "@/components/site-header";
import { ProjectsExplorer } from "@/components/projects-explorer";
import { getCachedDataset } from "@/lib/build";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const dataset = await getCachedDataset();
  const projects = dataset?.projects ?? [];

  return (
    <PageShell>
      <div>
        <h1 className="font-heading text-3xl font-semibold">全部项目</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {projects.length} 个测试相关仓库，按本周涨星、总星标或最近更新排序。
        </p>
      </div>
      <ProjectsExplorer projects={projects} />
    </PageShell>
  );
}
