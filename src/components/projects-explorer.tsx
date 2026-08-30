"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectRow } from "@/components/project-row";
import { SORT_LABELS } from "@/lib/labels";
import { filterProjects, sortProjects } from "@/lib/sort";
import type { ProjectRecord, SortKey } from "@/lib/types";

const SORTS: SortKey[] = ["trending", "stars", "updated", "newest"];

export function ProjectsExplorer({
  projects,
}: {
  projects: ProjectRecord[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("trending");

  const filtered = useMemo(
    () => sortProjects(filterProjects(projects, query, "all"), sort),
    [projects, query, sort],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索仓库、语言或 topic"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {SORTS.map((key) => (
            <Button
              key={key}
              size="sm"
              variant={sort === key ? "default" : "outline"}
              onClick={() => setSort(key)}
            >
              {SORT_LABELS[key]}
            </Button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
          没有符合筛选条件的项目。
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((project, index) => (
            <ProjectRow key={project.id} project={project} rank={index + 1} />
          ))}
        </ul>
      )}
    </div>
  );
}
