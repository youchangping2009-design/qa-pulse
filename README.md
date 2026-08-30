# QA Pulse

测试工程师开源目录。策展 GitHub 上与测试工程相关的项目，用每日星标快照计算今日 / 本周 / 本月涨幅。覆盖 E2E、API、性能、单元与集成、移动端、平台与报告、AI 测试、Mock / 契约、视觉 / 无障碍，以及安全测试。

页面结构对齐 [Best of JS](https://bestofjs.org/)：首页趋势、项目列表、分类、项目详情、周期榜。领域只保留测试工程师相关仓库。

## 怎么算涨幅

GitHub 没有公开的「本周新增 star」接口。本项目自行存快照：

1. 维护观察名单 `data/catalog.json`，再用搜索发现近期相关新仓。
2. 每次刷新把当前星标写入 `data/snapshots/YYYY-MM-DD.json`。
3. 今日涨幅 = 当前 − 昨天；本周 = 当前 − 7 天前；本月 = 当前 − 30 天前。没有刚好那天的快照时，回退到更早的最近一次，并标记窗口不足。

没有 token 也能看已生成的 `data/projects.json`；配置 Fine-grained PAT 后刷新更稳。

## 配置 Fine-grained PAT

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens。
2. Expiration 建议 90 天。
3. Repository access 选公开仓库只读。
4. Repository permissions 只开 **Metadata: Read-only**。
5. 复制示例配置并填入 token：

```bash
cp config/github.example.json config/github.local.json
```

优先级：环境变量 `GITHUB_TOKEN` / `QA_GITHUB_TOKEN` → `tokenFile` → 配置文件里的 `token`。

## 本地运行

```bash
npm install
npm run snapshot    # 拉取观察名单并生成 data/projects.json
npm run dev
```

开发服务默认 http://127.0.0.1:43217 。打开后可按分类浏览、搜索、导出本周 Markdown，或点击「刷新数据」。

观察名单在 `data/catalog.json`，发现规则在 `data/discovery.json`。换领域只需改这两份配置和 `src/lib/relevance.ts`。
