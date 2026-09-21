"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_MARK_LABELS } from "@/lib/labels";
import {
  PROJECT_MARK_STATES,
  type ProjectMarkState,
} from "@/lib/types";

export function ProjectMarkControl({
  projectId,
  initialState = null,
}: {
  projectId: string;
  initialState?: ProjectMarkState | null;
}) {
  const router = useRouter();
  const controlId = useId();
  const [state, setState] = useState<ProjectMarkState | null>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeState(value: string) {
    const nextState = value === "unmarked" ? null : (value as ProjectMarkState);
    const previousState = state;
    setState(nextState);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/project-marks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, state: nextState }),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(result.error || "保存失败");
        router.refresh();
      } catch (caught) {
        setState(previousState);
        setError(caught instanceof Error ? caught.message : "保存失败");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <label className="sr-only" htmlFor={controlId}>
        标记 {projectId}
      </label>
      <select
        id={controlId}
        value={state ?? "unmarked"}
        disabled={pending}
        onChange={(event) => changeState(event.target.value)}
        className="h-7 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <option value="unmarked">未标记</option>
        {PROJECT_MARK_STATES.map((value) => (
          <option key={value} value={value}>
            {PROJECT_MARK_LABELS[value]}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
