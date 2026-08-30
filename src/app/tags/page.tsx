import Link from "next/link";
import { PageShell } from "@/components/site-header";
import { getCachedDataset } from "@/lib/build";
import { TAG_LABELS } from "@/lib/labels";
import { tagCounts } from "@/lib/sort";
import { TAGS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const dataset = await getCachedDataset();
  const counts = tagCounts(dataset?.projects ?? []);

  return (
    <PageShell>
      <div>
        <h1 className="font-heading text-3xl font-semibold">分类</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          按测试工程师日常工作切分，只收录相关仓库。
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {TAGS.map((tag) => (
          <li key={tag}>
            <Link
              href={`/tags/${tag}`}
              className="flex items-center justify-between rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10 hover:bg-muted/40"
            >
              <span className="font-medium">{TAG_LABELS[tag]}</span>
              <span className="text-sm text-muted-foreground">
                {counts.get(tag) ?? 0} 个项目
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
