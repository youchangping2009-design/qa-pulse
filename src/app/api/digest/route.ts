import { NextResponse } from "next/server";
import { getCachedDigest, getOrBuildDigest } from "@/lib/digest";
import { publicConfigStatus } from "@/lib/config";

export async function GET() {
  const digest = await getCachedDigest();
  return NextResponse.json({
    digest,
    config: publicConfigStatus(),
  });
}

export async function POST() {
  try {
    const digest = await getOrBuildDigest(true);
    return NextResponse.json({
      digest,
      config: publicConfigStatus(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "刷新失败";
    return NextResponse.json({ error: message, config: publicConfigStatus() }, { status: 502 });
  }
}
