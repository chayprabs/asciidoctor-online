import { createHash } from "node:crypto";
import { posix } from "node:path";
import type { AsciidocProject, ProjectFile } from "@asciidoc-cloud/shared-types";

const INCLUDE_RE = /include::([^\[]+)\[([^\]]*)\]/g;
const TEXT_EXTENSIONS = /\.(adoc|asciidoc|txt)$/i;

function normalizeProjectPath(path: string): string {
  const normalized = posix.normalize(path.replace(/\\/g, "/")).replace(/^\/+/, "");
  if (!normalized || normalized.startsWith("../") || normalized === "..") {
    throw new Error(`Sandbox violation: ${path}`);
  }
  return normalized;
}

function isRemoteUrl(target: string): boolean {
  return /^https:\/\//i.test(target);
}

function isProbablyAttributeTarget(target: string): boolean {
  return /[{].*[}]/.test(target);
}

function sanitizeAllowlist(hosts: string[] | undefined): Set<string> {
  return new Set(
    (hosts ?? [])
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isAsciiDocTextFile(file: ProjectFile): boolean {
  return (file.encoding ?? "utf8") === "utf8" && TEXT_EXTENSIONS.test(file.path);
}

function resolveLocalInclude(fromPath: string, target: string): string {
  return normalizeProjectPath(posix.join(posix.dirname(fromPath), target));
}

function stagedRemotePath(url: string): string {
  const parsed = new URL(url);
  const ext = posix.extname(parsed.pathname) || ".adoc";
  const digest = createHash("sha1").update(url).digest("hex");
  return `.remote-includes/${parsed.hostname}/${digest}${ext}`;
}

async function fetchRemoteText(url: string, allowlist: Set<string>): Promise<string> {
  const parsed = new URL(url);
  if (!allowlist.has(parsed.hostname.toLowerCase())) {
    throw new Error(`Remote include host not allowlisted: ${parsed.hostname}`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Remote include fetch failed: ${url} (${response.status})`);
  }

  return response.text();
}

interface RewriteContext {
  filePath: string;
  parentRemoteUrl?: string;
}

interface RewriteState {
  allowlist: Set<string>;
  projectFiles: Map<string, ProjectFile>;
  fetchedFiles: Map<string, ProjectFile>;
}

async function rewriteIncludeTargets(
  content: string,
  context: RewriteContext,
  state: RewriteState,
): Promise<string> {
  const matches = [...content.matchAll(INCLUDE_RE)];
  if (!matches.length) {
    return content;
  }

  let rewritten = "";
  let lastIndex = 0;

  for (const match of matches) {
    const [fullMatch, rawTarget] = match;
    const target = rawTarget.trim();
    rewritten += content.slice(lastIndex, match.index);
    lastIndex = (match.index ?? 0) + fullMatch.length;

    if (isProbablyAttributeTarget(target)) {
      rewritten += fullMatch;
      continue;
    }

    if (context.parentRemoteUrl && !isRemoteUrl(target)) {
      const nestedRemoteUrl = new URL(target, context.parentRemoteUrl).toString();
      const localTarget = await stageRemoteInclude(nestedRemoteUrl, state);
      rewritten += fullMatch.replace(rawTarget, localTarget);
      continue;
    }

    if (isRemoteUrl(target)) {
      const localTarget = await stageRemoteInclude(target, state);
      rewritten += fullMatch.replace(rawTarget, localTarget);
      continue;
    }

    resolveLocalInclude(context.filePath, target);
    rewritten += fullMatch;
  }

  rewritten += content.slice(lastIndex);
  return rewritten;
}

async function stageRemoteInclude(url: string, state: RewriteState): Promise<string> {
  const localPath = stagedRemotePath(url);
  if (state.projectFiles.has(localPath) || state.fetchedFiles.has(localPath)) {
    return localPath;
  }

  const remoteContent = await fetchRemoteText(url, state.allowlist);
  const rewrittenContent = await rewriteIncludeTargets(
    remoteContent,
    { filePath: localPath, parentRemoteUrl: url },
    state,
  );

  state.fetchedFiles.set(localPath, {
    path: localPath,
    content: rewrittenContent,
    encoding: "utf8",
    mediaType: "text/plain",
  });

  return localPath;
}

export async function applyIncludePolicy(
  project: AsciidocProject,
): Promise<AsciidocProject> {
  const allowlist = sanitizeAllowlist(project.remoteIncludeAllowlist);
  const projectFiles = new Map(project.files.map((file) => [file.path, file]));
  const fetchedFiles = new Map<string, ProjectFile>();

  const files = await Promise.all(
    project.files.map(async (file) => {
      if (!isAsciiDocTextFile(file)) {
        return file;
      }

      return {
        ...file,
        content: await rewriteIncludeTargets(
          file.content,
          { filePath: file.path },
          { allowlist, projectFiles, fetchedFiles },
        ),
      };
    }),
  );

  return {
    ...project,
    files: [...files, ...fetchedFiles.values()],
    remoteIncludeAllowlist: [...allowlist],
  };
}
