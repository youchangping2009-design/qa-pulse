import { readFileSync } from "node:fs";
import path from "node:path";
import type { CatalogEntry, Tag } from "@/lib/types";
import { TAGS } from "@/lib/types";

type RawCatalogItem = {
  fullName: string;
  tags?: Tag[];
  categories?: Tag[];
  status?: CatalogEntry["status"];
  slug?: string;
  name?: string;
  homepage?: string;
};

type CatalogFile = {
  projects?: RawCatalogItem[];
  repos?: RawCatalogItem[];
};

const TAG_SET = new Set<string>(TAGS);

function isTag(value: string): value is Tag {
  return TAG_SET.has(value);
}

function normalizeTags(values: string[] | undefined): Tag[] {
  const tags = (values ?? []).filter(isTag);
  return tags.length ? [...new Set(tags)] : ["e2e"];
}

export function slugFromFullName(fullName: string, used: Set<string>): string {
  const [owner, repo] = fullName.split("/");
  const base = (repo ?? fullName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base && !used.has(base)) {
    used.add(base);
    return base;
  }
  const slug = `${(owner ?? "repo").toLowerCase()}-${base || "project"}`;
  used.add(slug);
  return slug;
}

export function loadCatalog(): CatalogEntry[] {
  const file = path.join(process.cwd(), "data", "catalog.json");
  const parsed = JSON.parse(readFileSync(file, "utf8")) as CatalogFile;
  const raw = parsed.projects ?? parsed.repos ?? [];
  const used = new Set<string>();
  const seen = new Set<string>();
  const entries: CatalogEntry[] = [];

  for (const item of raw) {
    const fullName = item.fullName.trim();
    const key = fullName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const tags = normalizeTags(
      "tags" in item && item.tags ? item.tags : item.categories,
    );
    entries.push({
      fullName,
      tags,
      status: item.status ?? "active",
      slug: item.slug || slugFromFullName(fullName, used),
      name: item.name,
      homepage: item.homepage,
    });
  }

  return entries;
}
