"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SORT_LABELS } from "@/lib/labels";
import type { SortKey } from "@/lib/types";

const SORTS: SortKey[] = ["trending", "stars", "updated", "newest"];

export function projectsHref(query: string, sort: SortKey): string {
  const params = new URLSearchParams();
  const q = query.trim();
  if (q) params.set("q", q);
  if (sort !== "trending") params.set("sort", sort);
  const qs = params.toString();
  return qs ? `/projects?${qs}` : "/projects";
}

export function ProjectsToolbar({
  query,
  sort,
}: {
  query: string;
  sort: SortKey;
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function go(nextQuery: string, nextSort: SortKey) {
    router.replace(projectsHref(nextQuery, nextSort), { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form
        action="/projects"
        method="get"
        className="relative w-full min-w-56 sm:max-w-xs"
        onSubmit={(event) => {
          event.preventDefault();
          go(value, sort);
        }}
      >
        {sort !== "trending" ? (
          <input type="hidden" name="sort" value={sort} />
        ) : null}
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            if (timer.current) window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => go(next, sort), 200);
          }}
          placeholder="搜索仓库、语言或 topic"
          className="h-8 w-full rounded-lg border border-input bg-transparent py-1 pr-2.5 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </form>
      <div className="flex flex-wrap gap-1">
        {SORTS.map((key) => (
          <Link
            key={key}
            href={projectsHref(value, key)}
            scroll={false}
            className={buttonVariants({
              size: "sm",
              variant: sort === key ? "default" : "outline",
            })}
          >
            {SORT_LABELS[key]}
          </Link>
        ))}
      </div>
    </div>
  );
}
