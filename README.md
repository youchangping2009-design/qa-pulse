# 测试工程周报

每周汇总 GitHub 上与测试工程师工作相关、星标涨幅较快的开源项目。覆盖 E2E / UI 自动化、API 测试、性能测试、单元与集成、移动端、测试平台与报告、Mock / 契约测试，以及 AI 测试工具。

## 怎么算「本周涨幅」

GitHub 没有公开的「本周新增 star」接口。2026 年 7 月起，第三方仓库的 stargazer 名单也收紧了，所以本项目用快照对比：

1. 维护一份测试领域 **观察名单**（`data/catalog.json`），再用搜索发现本周新建的相关仓库。
2. 每次刷新记录当前星标，写入 `data/snapshots/{周}.json`。
3. **本周涨幅 = 当前星标 − 上周快照**。本周新建的仓库，现有星标即本周涨幅。
4. 同一周内再次刷新，会相对本周第一次快照显示「周内涨幅」。

没有 token 也能看缓存周报；配置 Fine-grained PAT 后限额更高，刷新更稳。

## 配置 Fine-grained PAT

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**。
2. Expiration 建议 90 天。
3. Repository access 选公开仓库只读（All repositories 或 Public repositories 即可）。周报只读公开项目，不读你的私有代码。
4. Repository permissions 只开 **Metadata: Read-only**。
5. 复制示例配置并填入 token：

```bash
cp config/github.example.json config/github.local.json
```

`config/github.local.json`：

```json
{
  "token": "github_pat_xxxxxxxx",
  "tokenFile": "",
  "apiBaseUrl": "https://api.github.com"
}
```

`github.local.json` 已被 gitignore。也可以把 token 放到单独文件，把路径填进 `tokenFile`。

优先级：环境变量 `GITHUB_TOKEN` / `QA_GITHUB_TOKEN` → `tokenFile` → 配置文件里的 `token`。

应用内 `/settings` 只显示是否已加载和掩码，不会展示完整 token。

## 本地运行

```bash
npm install
npm run digest    # 拉取并生成本周周报
npm run dev
```

开发服务默认 http://127.0.0.1:43217 。打开页面后可按分类筛选、搜索、导出 Markdown，或点击「刷新本周数据」。

观察名单在 `data/catalog.json`，可按自己的技术栈增删。
