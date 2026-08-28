"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Download,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  KeyRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CATEGORIES, type Category, type Digest, type RepoRecord } from "@/lib/types";
import { CATEGORY_LABELS, GROWTH_SOURCE_LABELS } from "@/lib/labels";
import { formatCnDate, formatCnDateTime } from "@/lib/week";

export type ConfigStatus = {
  hasToken: boolean;
  authKind: "none" | "fine-grained" | "classic" | "other";
  tokenMasked: string | null;
  localConfigExists: boolean;
  configRelPath: string;
};

type SortKey = "growth" | "stars" | "updated";

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

function repoById(digest: Digest, id: string | null): RepoRecord | undefined {
  if (!id) return undefined;
  return digest.repos.find((r) => r.id === id);
}

export function DigestDashboard({
  initialDigest,
  initialConfig,
}: {
  initialDigest: Digest | null;
  initialConfig: ConfigStatus;
}) {
  const [digest, setDigest] = useState(initialDigest);
  const [config, setConfig] = useState(initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [sort, setSort] = useState<SortKey>("growth");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!digest) return [];
    const q = query.trim().toLowerCase();
    const list = digest.repos.filter((repo) => {
      if (category !== "all" && !repo.categories.includes(category)) return false;
      if (!q) return true;
      const blob = [
        repo.id,
        repo.description ?? "",
        repo.language ?? "",
        ...repo.topics,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
    return list.sort((a, b) => {
      if (sort === "stars") return b.stars - a.stars;
      if (sort === "updated") {
        return (b.pushedAt ?? "").localeCompare(a.pushedAt ?? "");
      }
      const ga = a.starsThisWeek ?? -1;
      const gb = b.starsThisWeek ?? -1;
      if (gb !== ga) return gb - ga;
      return b.stars - a.stars;
    });
  }, [digest, query, category, sort]);

  function refresh() {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/digest", { method: "POST" });
      const data = (await response.json()) as {
        digest?: Digest;
        error?: string;
        config?: ConfigStatus;
      };
      if (data.config) setConfig(data.config);
      if (!response.ok || !data.digest) {
        setError(data.error || "刷新失败");
        return;
      }
      setDigest(data.digest);
    });
  }

  const fastest = digest ? repoById(digest, digest.highlights.fastest) : undefined;
  const newcomer = digest ? repoById(digest, digest.highlights.newcomer) : undefined;
  const starred = digest ? repoById(digest, digest.highlights.mostStarred) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-wide text-emerald-800">
            测试工程师 · GitHub 周报
          </p>
          <h1 className="font-heading mt-2 text-3xl leading-tight font-semibold text-foreground sm:text-4xl">
            本周星涨最快的测试相关项目
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            观察名单覆盖 E2E、API、性能、移动端、平台报告和 AI 测试。涨幅优先对比每周快照；本周新仓的星标记为本周涨幅。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" render={<Link href="/settings" />}>
            <KeyRound />
            Token 配置
          </Button>
          <Button
            variant="outline"
            render={<a href="/api/digest/markdown" />}
            disabled={!digest}
          >
            <Download />
            导出 Markdown
          </Button>
          <Button onClick={refresh} disabled={pending}>
            <RefreshCw className={pending ? "animate-spin" : ""} />
            {pending ? "拉取中" : "刷新本周数据"}
          </Button>
        </div>
      </header>

      <TokenBanner config={config} />

      {digest ? (
        <p className="text-sm text-muted-foreground">
          {digest.weekId} · {formatCnDate(digest.weekStart)} – {formatCnDate(digest.weekEnd)} ·
          生成于 {formatCnDateTime(digest.generatedAt)} · {digest.repos.length} 个项目
        </p>
      ) : (
        <EmptyDigest onRefresh={refresh} pending={pending} />
      )}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {digest ? (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <HighlightCard
              kicker="涨星冠军"
              repo={fastest}
              value={
                fastest?.starsThisWeek != null
                  ? `+${fastest.starsThisWeek}`
                  : "本周暂无"
              }
            />
            <HighlightCard kicker="本周新晋" repo={newcomer} value={newcomer ? "New" : "暂无"} />
            <HighlightCard
              kicker="观察名单最高星"
              repo={starred}
              value={starred ? formatStars(starred.stars) : "—"}
            />
          </section>

          {digest.note ? (
            <p className="rounded-lg border bg-card/80 px-4 py-3 text-sm leading-6 text-muted-foreground">
              {digest.note}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  active={category === "all"}
                  onClick={() => setCategory("all")}
                >
                  全部
                </FilterChip>
                {CATEGORIES.map((item) => (
                  <FilterChip
                    key={item}
                    active={category === item}
                    onClick={() => setCategory(item)}
                  >
                    {CATEGORY_LABELS[item]}
                  </FilterChip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full min-w-56 flex-1 sm:max-w-xs">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索仓库、语言或 topic"
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-1">
                  {(
                    [
                      ["growth", "本周涨星"],
                      ["stars", "总星标"],
                      ["updated", "最近更新"],
                    ] as const
                  ).map(([key, label]) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={sort === key ? "default" : "outline"}
                      onClick={() => setSort(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
                没有符合筛选条件的项目。试试换一个分类，或清空搜索。
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {filtered.map((repo, index) => (
                  <RepoRow key={repo.id} repo={repo} rank={index + 1} />
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function TokenBanner({ config }: { config: ConfigStatus }) {
  if (config.hasToken && config.authKind === "fine-grained") {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-emerald-800/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Fine-grained PAT 已从配置文件加载（{config.tokenMasked}）。
        </span>
        <Link href="/settings" className="font-medium underline-offset-4 hover:underline">
          查看权限说明
        </Link>
      </div>
    );
  }
  if (config.hasToken) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border bg-card px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span>已加载 token（{config.tokenMasked}，类型 {config.authKind}）。推荐改用 Fine-grained PAT。</span>
        <Link href="/settings" className="font-medium underline-offset-4 hover:underline">
          配置说明
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-800/20 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
      <span>
        未配置 GitHub token。未认证每小时约 60 次请求，容易触达限额。请复制{" "}
        <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">
          {config.configRelPath}
        </code>{" "}
        并填入 Fine-grained PAT。
      </span>
      <Link href="/settings" className="shrink-0 font-medium underline-offset-4 hover:underline">
        去配置
      </Link>
    </div>
  );
}

function EmptyDigest({
  onRefresh,
  pending,
}: {
  onRefresh: () => void;
  pending: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>还没有本周周报</CardTitle>
        <CardDescription>
          配置 Fine-grained PAT 后点击刷新，会拉取观察名单和本周新仓，并写入本周快照。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onRefresh} disabled={pending}>
          <Sparkles />
          生成第一期周报
        </Button>
      </CardContent>
    </Card>
  );
}

function HighlightCard({
  kicker,
  repo,
  value,
}: {
  kicker: string;
  repo?: RepoRecord;
  value: string;
}) {
  return (
    <Card size="sm" className="bg-card/90">
      <CardHeader>
        <CardDescription>{kicker}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        {repo ? (
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start justify-between gap-2"
          >
            <span>
              <span className="font-medium">{repo.id}</span>
              <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                {repo.description || "暂无描述"}
              </span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">本周暂无</span>
        )}
      </CardContent>
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className="rounded-full"
    >
      {children}
    </Button>
  );
}

function RepoRow({ repo, rank }: { repo: RepoRecord; rank: number }) {
  const growth =
    repo.starsThisWeek == null ? "待快照" : `+${repo.starsThisWeek}`;
  return (
    <li className="rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3 sm:w-16 sm:flex-col sm:items-center sm:pt-1">
          <span className="font-heading text-xl font-semibold text-muted-foreground">
            {String(rank).padStart(2, "0")}
          </span>
          {repo.ownerAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={repo.ownerAvatar}
              alt=""
              className="size-8 rounded-full ring-1 ring-foreground/10"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={repo.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:underline"
            >
              {repo.id}
            </a>
            {repo.isNewThisWeek ? <Badge>本周新仓</Badge> : null}
            {repo.source === "watchlist" ? (
              <Badge variant="secondary">观察名单</Badge>
            ) : (
              <Badge variant="outline">新发现</Badge>
            )}
            {repo.language ? <Badge variant="outline">{repo.language}</Badge> : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {repo.description || "暂无描述"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {repo.categories.map((cat) => (
              <Badge key={cat} variant="secondary">
                {CATEGORY_LABELS[cat]}
              </Badge>
            ))}
          </div>
        </div>
        <Separator className="sm:hidden" />
        <div className="flex shrink-0 items-end justify-between gap-6 sm:min-w-40 sm:flex-col sm:items-end">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">本周涨星</p>
            <p className="font-heading text-2xl font-semibold text-emerald-800">
              {growth}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {GROWTH_SOURCE_LABELS[repo.growthSource]}
            </p>
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="size-3.5" />
            {formatStars(repo.stars)}
          </p>
        </div>
      </div>
    </li>
  );
}
