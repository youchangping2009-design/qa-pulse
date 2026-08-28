import Link from "next/link";
import { publicConfigStatus } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const status = publicConfigStatus();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/" />}>
          ← 返回周报
        </Button>
        <h1 className="font-heading mt-4 text-3xl font-semibold">GitHub Token 配置</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          本项目使用 Fine-grained personal access token，写在本地配置文件里，不进 Git。页面不会展示完整 token。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>当前状态</CardTitle>
          <CardDescription>启动或刷新时读取配置，环境变量优先于文件。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="是否已加载">
            {status.hasToken ? (
              <Badge>已配置</Badge>
            ) : (
              <Badge variant="outline">未配置</Badge>
            )}
          </Row>
          <Row label="类型">
            {status.authKind === "fine-grained"
              ? "Fine-grained PAT"
              : status.authKind === "classic"
                ? "Classic PAT"
                : status.authKind === "other"
                  ? "其他 Bearer token"
                  : "无"}
          </Row>
          <Row label="来源">
            {status.tokenSource === "env"
              ? "环境变量 GITHUB_TOKEN / QA_GITHUB_TOKEN"
              : status.tokenSource === "token-file"
                ? "github.local.json 中的 tokenFile"
                : status.tokenSource === "config-file"
                  ? "config/github.local.json"
                  : "未找到"}
          </Row>
          <Row label="掩码">{status.tokenMasked ?? "—"}</Row>
          <Row label="本地配置文件">
            {status.localConfigExists ? "已存在 github.local.json" : "尚未创建"}
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. 创建 Fine-grained PAT</CardTitle>
          <CardDescription>
            打开 GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Token name 填 <code className="font-mono text-xs">qa-github-weekly</code>。</li>
            <li>Expiration 建议 90 天，到期后只换 token，不必改代码。</li>
            <li>
              Resource owner 选你的个人账号。
            </li>
            <li>
              Repository access 选 <strong>All repositories</strong> 或 Public repositories（只读公开仓库即可）。本周报只读公开项目元数据和搜索结果，不访问你的私有代码。
            </li>
            <li>
              Repository permissions 只需 <strong>Metadata: Read-only</strong>。不要勾选 Contents、Pull requests 等写权限。
            </li>
            <li>生成后复制以 <code className="font-mono text-xs">github_pat_</code> 开头的字符串。</li>
          </ol>
          <p className="text-muted-foreground">
            2026 年 7 月起，第三方仓库的 stargazer 名单接口已收紧。本项目用每周星标快照计算涨幅，不需要 Stargazers 写权限。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. 写入项目配置文件</CardTitle>
          <CardDescription>
            复制示例文件，填入 token。该文件已被 gitignore。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6">
          <pre className="overflow-x-auto rounded-lg bg-muted px-4 py-3 font-mono text-xs">
{`cp config/github.example.json config/github.local.json`}
          </pre>
          <p>编辑 <code className="font-mono text-xs">config/github.local.json</code>：</p>
          <pre className="overflow-x-auto rounded-lg bg-muted px-4 py-3 font-mono text-xs">
{`{
  "token": "github_pat_xxxxxxxx",
  "tokenFile": "",
  "apiBaseUrl": "https://api.github.com"
}`}
          </pre>
          <p>
            也可以把 token 放到独立文件，再把路径填进 <code className="font-mono text-xs">tokenFile</code>（相对仓库根目录或绝对路径）。
          </p>
          <p className="text-muted-foreground">
            优先级：环境变量 <code className="font-mono text-xs">GITHUB_TOKEN</code> /{" "}
            <code className="font-mono text-xs">QA_GITHUB_TOKEN</code> →{" "}
            <code className="font-mono text-xs">tokenFile</code> → 配置文件里的{" "}
            <code className="font-mono text-xs">token</code>。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="sm:text-right">{children}</span>
    </div>
  );
}
