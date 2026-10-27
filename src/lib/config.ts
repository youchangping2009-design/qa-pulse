import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type GithubAuthKind = "none" | "fine-grained" | "classic" | "other";

export type GithubConfigFile = {
  token?: string;
  tokenFile?: string;
  apiBaseUrl?: string;
};

export type AppConfigFile = {
  cacheTtlHours?: number;
  discoveryEnabled?: boolean;
  projectFetchConcurrency?: number;
  userAgent?: string;
};

export type ResolvedConfig = {
  token: string | null;
  authKind: GithubAuthKind;
  tokenSource: "env" | "config-file" | "token-file" | "none";
  tokenMasked: string | null;
  apiBaseUrl: string;
  userAgent: string;
  cacheTtlHours: number;
  discoveryEnabled: boolean;
  projectFetchConcurrency: number;
  configPath: string;
  examplePath: string;
};

const ROOT = process.cwd();
const LOCAL_CONFIG = path.join(ROOT, "config", "github.local.json");
const EXAMPLE_CONFIG = path.join(ROOT, "config", "github.example.json");
const APP_CONFIG = path.join(ROOT, "config", "app.json");

function readJson<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  if (!raw.trim()) return null;
  return JSON.parse(raw) as T;
}

function detectKind(token: string): GithubAuthKind {
  if (token.startsWith("github_pat_")) return "fine-grained";
  if (token.startsWith("ghp_")) return "classic";
  return "other";
}

export function maskToken(token: string): string {
  const prefix =
    token.startsWith("github_pat_")
      ? "github_pat_"
      : token.startsWith("ghp_")
        ? "ghp_"
        : "";
  const visible = token.slice(-4);
  return `${prefix}****${visible}`;
}

function readTokenFile(tokenFile: string): string | null {
  const resolved = path.isAbsolute(tokenFile)
    ? tokenFile
    : path.join(ROOT, tokenFile);
  if (!existsSync(resolved)) {
    throw new Error(`tokenFile 不存在：${resolved}`);
  }
  const value = readFileSync(resolved, "utf8").trim();
  return value || null;
}

function pickTokenFromConfig(file: GithubConfigFile | null): {
  token: string | null;
  source: ResolvedConfig["tokenSource"];
} {
  if (!file) return { token: null, source: "none" };

  const filePath = file.tokenFile?.trim();
  if (filePath) {
    const fromFile = readTokenFile(filePath);
    if (fromFile) return { token: fromFile, source: "token-file" };
  }

  const inline = file.token?.trim() ?? "";
  if (!inline) return { token: null, source: "none" };
  if (inline.includes("在此粘贴") || inline.includes("ReplaceMe")) {
    return { token: null, source: "none" };
  }
  return { token: inline, source: "config-file" };
}

export function loadConfig(): ResolvedConfig {
  const app = readJson<AppConfigFile>(APP_CONFIG) ?? {};
  const local = readJson<GithubConfigFile>(LOCAL_CONFIG);
  const example = local ? null : readJson<GithubConfigFile>(EXAMPLE_CONFIG);

  const envToken =
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.QA_GITHUB_TOKEN?.trim() ||
    "";

  let token: string | null = null;
  let tokenSource: ResolvedConfig["tokenSource"] = "none";

  if (envToken) {
    token = envToken;
    tokenSource = "env";
  } else {
    const picked = pickTokenFromConfig(local ?? example);
    token = picked.token;
    tokenSource = picked.source;
  }

  const authKind: GithubAuthKind = token ? detectKind(token) : "none";

  return {
    token,
    authKind,
    tokenSource,
    tokenMasked: token ? maskToken(token) : null,
    apiBaseUrl: (local?.apiBaseUrl || "https://api.github.com").replace(
      /\/$/,
      "",
    ),
    userAgent: app.userAgent || "best-of-qa",
    cacheTtlHours: app.cacheTtlHours ?? 6,
    discoveryEnabled: app.discoveryEnabled ?? true,
    projectFetchConcurrency: app.projectFetchConcurrency ?? 4,
    configPath: LOCAL_CONFIG,
    examplePath: EXAMPLE_CONFIG,
  };
}

export function publicConfigStatus() {
  const config = loadConfig();
  return {
    hasToken: Boolean(config.token),
    authKind: config.authKind,
    tokenSource: config.tokenSource,
    tokenMasked: config.tokenMasked,
    apiBaseUrl: config.apiBaseUrl,
    discoveryEnabled: config.discoveryEnabled,
    cacheTtlHours: config.cacheTtlHours,
    localConfigExists: existsSync(LOCAL_CONFIG),
    configRelPath: "config/github.local.json",
    exampleRelPath: "config/github.example.json",
  };
}
