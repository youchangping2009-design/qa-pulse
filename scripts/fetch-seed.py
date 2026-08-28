#!/usr/bin/env python3
"""拉取观察名单与本周新仓，生成首期周报种子数据。"""

from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / "data" / "catalog.json").read_text())
OUT = ROOT / "data" / "digests" / "latest.json"
SNAP = ROOT / "data" / "snapshots"

UA = "qa-github-weekly"
API = "https://api.github.com"


def load_token() -> str | None:
    local = ROOT / "config" / "github.local.json"
    if not local.exists():
        return None
    data = json.loads(local.read_text())
    token_file = (data.get("tokenFile") or "").strip()
    if token_file:
        path = Path(token_file)
        if not path.is_absolute():
            path = ROOT / path
        text = path.read_text().strip()
        return text or None
    token = (data.get("token") or "").strip()
    if not token or "在此粘贴" in token or "ReplaceMe" in token:
        return None
    return token


def request(url: str) -> dict | list:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": UA,
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("QA_GITHUB_TOKEN") or load_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def iso_week_range(now: datetime) -> tuple[str, str, str]:
    day = now.weekday()  # Mon=0
    start = (now - timedelta(days=day)).replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=6)
    iso = start.isocalendar()
    week_id = f"{iso.year}-W{iso.week:02d}"
    return week_id, start.date().isoformat(), end.date().isoformat()


def to_repo(item: dict, categories: list[str], source: str) -> dict:
    owner = item["owner"]
    created = item.get("created_at") or ""
    return {
        "id": item["full_name"],
        "name": item["name"],
        "owner": owner["login"],
        "ownerAvatar": owner.get("avatar_url"),
        "description": item.get("description"),
        "url": item["html_url"],
        "stars": item.get("stargazers_count") or 0,
        "forks": item.get("forks_count") or 0,
        "language": item.get("language"),
        "topics": item.get("topics") or [],
        "license": (item.get("license") or {}).get("spdx_id") if item.get("license") else None,
        "createdAt": created,
        "pushedAt": item.get("pushed_at"),
        "homepage": item.get("homepage") or None,
        "categories": categories,
        "source": source,
    }


def search(query: str, per_page: int = 10) -> list[dict]:
    qs = urllib.parse.urlencode({"q": query, "per_page": per_page})
    data = request(f"{API}/search/repositories?{qs}")
    assert isinstance(data, dict)
    return data.get("items") or []


def batched_repo_search(full_names: list[str]) -> list[dict]:
    found: list[dict] = []
    for i in range(0, len(full_names), 5):
        batch = full_names[i : i + 5]
        q = " ".join(f"repo:{name}" for name in batch)
        items = search(q, per_page=5)
        found.extend(items)
        time.sleep(1.2)
    return found


RELEVANT = (
    "test",
    "testing",
    "e2e",
    "qa",
    "playwright",
    "cypress",
    "selenium",
    "pytest",
    "junit",
    "appium",
    "jmeter",
    "k6",
    "locust",
    "gatling",
    "mock",
    "coverage",
    "allure",
    "webdriver",
    "assert",
    "automation",
    "quality",
)

EXCLUDE = (
    "job applier",
    "resume",
    "leetcode",
    "crypto",
    "vpn",
    "bypass discord",
)


def is_relevant(item: dict) -> bool:
    blob = " ".join(
        [
            item.get("full_name") or "",
            item.get("description") or "",
            " ".join(item.get("topics") or []),
        ]
    ).lower()
    if any(x in blob for x in EXCLUDE):
        return False
    topics = {t.lower() for t in (item.get("topics") or [])}
    topic_hit = topics & {
        "testing",
        "test-automation",
        "e2e-testing",
        "playwright",
        "cypress",
        "selenium",
        "pytest",
        "appium",
        "qa",
        "quality-assurance",
        "api-testing",
        "performance-testing",
        "load-testing",
    }
    if topic_hit:
        return True
    return any(k in blob for k in RELEVANT)


def infer_categories(item: dict) -> list[str]:
    blob = " ".join(
        [
            item.get("full_name") or "",
            item.get("description") or "",
            " ".join(item.get("topics") or []),
        ]
    ).lower()
    cats: list[str] = []
    rules = [
        ("ai", ("ai", "agent", "llm", "mcp")),
        ("e2e", ("playwright", "cypress", "selenium", "e2e", "webdriver", "puppeteer")),
        ("api", ("api", "rest", "http", "graphql", "contract")),
        ("performance", ("k6", "jmeter", "locust", "gatling", "load", "performance")),
        ("mobile", ("appium", "android", "ios", "mobile", "maestro", "detox")),
        ("contract", ("mock", "wiremock", "pact", "msw")),
        ("platform", ("allure", "report", "platform", "dashboard")),
        ("unit", ("unit", "pytest", "jest", "vitest", "junit", "testcontainer")),
    ]
    for cat, keys in rules:
        if any(k in blob for k in keys):
            cats.append(cat)
    return cats or ["e2e"]


def main() -> None:
    now = datetime.now(timezone.utc)
    week_id, week_start, week_end = iso_week_range(now)
    catalog_map = {r["fullName"]: r["categories"] for r in CATALOG["repos"]}
    names = list(catalog_map)

    print(f"fetching watchlist ({len(names)}) …")
    watch_items = batched_repo_search(names)
    watch_by_id = {i["full_name"]: i for i in watch_items}

    repos: list[dict] = []
    snapshot = {"weekId": week_id, "capturedAt": now.isoformat(), "stars": {}}

    for full_name, categories in catalog_map.items():
        item = watch_by_id.get(full_name)
        if not item:
            print(f"  missing {full_name}")
            continue
        repo = to_repo(item, categories, "watchlist")
        created = datetime.fromisoformat(repo["createdAt"].replace("Z", "+00:00"))
        week_start_dt = datetime.fromisoformat(week_start + "T00:00:00+00:00")
        is_new = created >= week_start_dt
        repo["isNewThisWeek"] = is_new
        repo["starsThisWeek"] = repo["stars"] if is_new else None
        repo["starsThisWeekCapped"] = False
        repo["growthSource"] = "new-repo" if is_new else "pending-snapshot"
        repos.append(repo)
        snapshot["stars"][full_name] = repo["stars"]

    print("fetching new repos this week …")
    q1 = (
        f"created:>={week_start} "
        f"(playwright OR cypress OR selenium OR pytest OR appium OR "
        f'"test automation" OR jmeter OR k6 OR "e2e testing") stars:>=3'
    )
    q2 = (
        f"created:>={week_start} "
        f"(topic:testing OR topic:test-automation OR topic:playwright) stars:>=3"
    )
    discovered: dict[str, dict] = {}
    for q in (q1, q2):
        for item in search(q, per_page=15):
            discovered[item["full_name"]] = item
        time.sleep(1.2)

    for item in discovered.values():
        if item["full_name"] in snapshot["stars"]:
            continue
        if not is_relevant(item):
            continue
        repo = to_repo(item, infer_categories(item), "discovery")
        repo["isNewThisWeek"] = True
        repo["starsThisWeek"] = repo["stars"]
        repo["starsThisWeekCapped"] = False
        repo["growthSource"] = "new-repo"
        repos.append(repo)
        snapshot["stars"][repo["id"]] = repo["stars"]

    def sort_key(r: dict) -> tuple:
        growth = r["starsThisWeek"] if r["starsThisWeek"] is not None else -1
        return (-growth, -r["stars"])

    repos.sort(key=sort_key)

    with_growth = [r for r in repos if r["starsThisWeek"]]
    newcomers = [r for r in repos if r["isNewThisWeek"]]
    highlights = {
        "fastest": with_growth[0]["id"] if with_growth else (repos[0]["id"] if repos else None),
        "newcomer": newcomers[0]["id"] if newcomers else None,
        "mostStarred": max(repos, key=lambda r: r["stars"])["id"] if repos else None,
    }

    digest = {
        "weekId": week_id,
        "weekStart": week_start,
        "weekEnd": week_end,
        "generatedAt": now.isoformat(),
        "source": "seed",
        "hasToken": False,
        "note": "首期快照已写入。观察名单的真实周涨幅将从下一周开始计算；本周新仓的星标即本周涨幅。配置 GITHUB_TOKEN 后可按近 7 天 stargazer 补算老仓库涨幅。",
        "highlights": highlights,
        "repos": repos,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    SNAP.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(digest, ensure_ascii=False, indent=2))
    (SNAP / f"{week_id}.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2))
    print(f"wrote {OUT} ({len(repos)} repos)")


if __name__ == "__main__":
    main()
