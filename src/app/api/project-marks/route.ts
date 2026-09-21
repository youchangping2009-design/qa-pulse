import { NextResponse } from "next/server";
import {
  isProjectMarkState,
  updateProjectMark,
} from "@/lib/project-marks";

const PROJECT_ID = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "请求内容无效" }, { status: 400 });
  }

  const { projectId, state } = body as {
    projectId?: unknown;
    state?: unknown;
  };

  if (typeof projectId !== "string" || !PROJECT_ID.test(projectId)) {
    return NextResponse.json({ error: "项目 ID 无效" }, { status: 400 });
  }
  if (state !== null && !isProjectMarkState(state)) {
    return NextResponse.json({ error: "标记状态无效" }, { status: 400 });
  }

  try {
    const marks = updateProjectMark(projectId, state);
    return NextResponse.json({
      ok: true,
      mark: marks[projectId.toLowerCase()] ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
