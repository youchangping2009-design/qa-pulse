"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConfigStatus, Dataset } from "@/lib/types";

export function RefreshBar({
  initialConfig,
  note,
}: {
  initialConfig: ConfigStatus;
  note?: string;
}) {
  const router = useRouter();
  const [config, setConfig] = useState(initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/projects", { method: "POST" });
      const data = (await response.json()) as {
        dataset?: Dataset;
        error?: string;
        config?: ConfigStatus;
      };
      if (data.config) setConfig(data.config);
      if (!response.ok || !data.dataset) {
        setError(data.error || "刷新失败");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={refresh} disabled={pending}>
          <RefreshCw className={pending ? "animate-spin" : ""} />
          {pending ? "拉取中" : "刷新数据"}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href="/api/projects/markdown" />}
        >
          <Download />
          导出本周榜
        </Button>
        <p className="text-sm text-muted-foreground">
          {config.hasToken
            ? `Token 已加载（${config.tokenMasked}）`
            : "未配置 token，页面只读本地缓存"}
        </p>
      </div>
      {note ? (
        <p className="rounded-lg border bg-card/80 px-4 py-3 text-sm leading-6 text-muted-foreground">
          {note}
        </p>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
