import { NextResponse } from "next/server";
import { getCachedDataset, getOrBuildDataset } from "@/lib/build";
import { publicConfigStatus } from "@/lib/config";

export const maxDuration = 300;

export async function GET() {
  const dataset = await getCachedDataset();
  return NextResponse.json({
    dataset,
    config: publicConfigStatus(),
  });
}

export async function POST() {
  try {
    const dataset = await getOrBuildDataset(true);
    return NextResponse.json({
      ok: true,
      generatedAt: dataset.generatedAt,
      count: dataset.projects.length,
      note: dataset.note,
      config: publicConfigStatus(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "刷新失败";
    return NextResponse.json(
      { ok: false, error: message, config: publicConfigStatus() },
      { status: 502 },
    );
  }
}
