import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { ConfigStatus } from "@/lib/types";

export function RefreshBar({
  initialConfig,
  note,
  flash,
}: {
  initialConfig: ConfigStatus;
  note?: string;
  flash?: "ok" | "error" | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <form action="/refresh" method="post">
          <button type="submit" className={buttonVariants()}>
            刷新数据
          </button>
        </form>
        <a
          href="/api/projects/markdown"
          className={buttonVariants({ variant: "outline" })}
        >
          <Download />
          导出本周榜
        </a>
        <p className="text-sm text-muted-foreground">
          {initialConfig.hasToken
            ? `Token 已加载（${initialConfig.tokenMasked}）`
            : "未配置 token，页面只读本地缓存"}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        点刷新后浏览器会等待约一分钟，请不要关闭页面。也可以在项目根目录运行{" "}
        <code className="font-mono">npm run snapshot</code>。
      </p>
      {flash === "ok" ? (
        <p className="rounded-lg border border-emerald-800/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          数据已更新。
        </p>
      ) : null}
      {flash === "error" ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          刷新失败，请检查 token 后重试。
        </div>
      ) : null}
      {note ? (
        <p className="rounded-lg border bg-card/80 px-4 py-3 text-sm leading-6 text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}
