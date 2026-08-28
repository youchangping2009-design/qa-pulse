import { NextResponse } from "next/server";
import { getCachedDigest, toMarkdown } from "@/lib/digest";

export async function GET() {
  const digest = await getCachedDigest();
  if (!digest) {
    return NextResponse.json({ error: "还没有周报" }, { status: 404 });
  }
  const body = toMarkdown(digest);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="qa-weekly-${digest.weekId}.md"`,
    },
  });
}
