import { NextResponse } from "next/server";
import { getCachedDataset, toWeeklyMarkdown } from "@/lib/build";
import {
  excludeMarkedProjects,
  loadProjectMarks,
} from "@/lib/project-marks";

export async function GET() {
  const dataset = await getCachedDataset();
  if (!dataset) {
    return NextResponse.json({ error: "还没有项目数据" }, { status: 404 });
  }
  const body = toWeeklyMarkdown({
    ...dataset,
    projects: excludeMarkedProjects(dataset.projects, loadProjectMarks()),
  });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="best-of-qa-weekly.md"`,
    },
  });
}
