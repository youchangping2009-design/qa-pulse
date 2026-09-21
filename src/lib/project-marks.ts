import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  PROJECT_MARK_STATES,
  type ProjectMark,
  type ProjectMarks,
  type ProjectMarkState,
  type ProjectRecord,
} from "@/lib/types";

const MARKS_FILE = path.join(process.cwd(), "data", "project-marks.json");
const MARK_STATE_SET = new Set<string>(PROJECT_MARK_STATES);

export function isProjectMarkState(value: unknown): value is ProjectMarkState {
  return typeof value === "string" && MARK_STATE_SET.has(value);
}

function isProjectMark(value: unknown): value is ProjectMark {
  if (!value || typeof value !== "object") return false;
  const mark = value as Partial<ProjectMark>;
  return isProjectMarkState(mark.state) && typeof mark.updatedAt === "string";
}

function normalizeProjectId(projectId: string): string {
  return projectId.trim().toLowerCase();
}

function readProjectMarks(): ProjectMarks {
  if (!existsSync(MARKS_FILE)) return {};

  const raw = JSON.parse(readFileSync(MARKS_FILE, "utf8")) as unknown;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("项目标记文件格式无效");
  }

  return Object.fromEntries(
    Object.entries(raw)
      .filter((entry): entry is [string, ProjectMark] =>
        isProjectMark(entry[1]),
      )
      .map(([projectId, mark]) => [normalizeProjectId(projectId), mark]),
  );
}

export function loadProjectMarks(): ProjectMarks {
  try {
    return readProjectMarks();
  } catch (error) {
    console.warn("读取项目标记失败，已按空标记处理。", error);
    return {};
  }
}

function saveProjectMarks(marks: ProjectMarks) {
  mkdirSync(path.dirname(MARKS_FILE), { recursive: true });
  const temporaryFile = `${MARKS_FILE}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporaryFile, `${JSON.stringify(marks, null, 2)}\n`);
  renameSync(temporaryFile, MARKS_FILE);
}

export function updateProjectMark(
  projectId: string,
  state: ProjectMarkState | null,
): ProjectMarks {
  const key = normalizeProjectId(projectId);
  const marks = readProjectMarks();

  if (state == null) {
    delete marks[key];
  } else {
    marks[key] = { state, updatedAt: new Date().toISOString() };
  }

  saveProjectMarks(marks);
  return marks;
}

export function markForProject(
  marks: ProjectMarks,
  projectId: string,
): ProjectMark | null {
  return marks[normalizeProjectId(projectId)] ?? null;
}

export function excludeMarkedProjects(
  projects: ProjectRecord[],
  marks: ProjectMarks,
): ProjectRecord[] {
  return projects.filter((project) => !markForProject(marks, project.id));
}
