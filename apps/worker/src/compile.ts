import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { spawn } from "node:child_process";
import type {
  AsciidocProject,
  CompileFormat,
  CompileResult,
  ProjectFile,
} from "@asciidoc-cloud/shared-types";
import {
  cleanupJobDir,
  createJobDir,
  redactLogLine,
} from "@asciidoc-cloud/shared-worker-runtime";
import { applyIncludePolicy } from "./include-policy.js";
import { writeProjectArchive } from "./archive.js";
import { getPersistentJrubyRunner } from "./persistent-jruby.js";

const ASCIIDOCTOR = process.env.ASCIIDOCTOR_BIN ?? "asciidoctor";
const ASCIIDOCTOR_PDF = process.env.ASCIIDOCTOR_PDF_BIN ?? "asciidoctor-pdf";
const ASCIIDOCTOR_EPUB = process.env.ASCIIDOCTOR_EPUB_BIN ?? "asciidoctor-epub3";
const JRUBY_RUNNER = process.env.JRUBY_RUNNER ?? "cli";
const REQUIRED_EXTENSIONS = (process.env.ASCIIDOCTOR_REQUIRE_PATHS ?? "asciidoctor-diagram")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

function run(cmd: string, args: string[], cwd: string): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: process.platform === "win32" });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += redactLogLine(d.toString());
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stderr }));
  });
}

function normalizePath(p: string): string {
  const cleaned = p.replace(/\\/g, "/").replace(/^\/+/, "");
  if (cleaned.includes("..")) {
    throw new Error(`Invalid path: ${p}`);
  }
  return cleaned;
}

function withExtensions(args: string[]): string[] {
  return REQUIRED_EXTENSIONS.flatMap((extension) => ["-r", extension]).concat(args);
}

export function extractMissingAssets(stderr: string): string[] {
  const lines = stderr.split(/\r?\n/);
  const missing = new Set<string>();

  for (const line of lines) {
    if (!/not found|not readable/i.test(line)) {
      continue;
    }

    const match = line.match(/line (\d+): (.+)$/i);
    if (match) {
      missing.add(`line ${match[1]}: ${match[2].trim()}`);
      continue;
    }

    missing.add(line.trim());
  }

  return [...missing];
}

export function pickEntryPath(
  project: AsciidocProject,
  requestedEntryPath?: string,
): string {
  const requested = requestedEntryPath?.trim();
  if (requested && project.files.some((file) => file.path === requested)) {
    return requested;
  }

  return (
    project.files.find((file) => file.path.endsWith(".adoc"))?.path ??
    project.files[0]?.path ??
    ""
  );
}

export function fileContentToBuffer(file: ProjectFile): Buffer {
  return file.encoding === "base64"
    ? Buffer.from(file.content, "base64")
    : Buffer.from(file.content, "utf8");
}

async function writeProject(
  root: string,
  project: AsciidocProject,
  requestedEntryPath?: string,
): Promise<string> {
  const entry = pickEntryPath(project, requestedEntryPath);
  if (!entry) throw new Error("Project has no files");

  for (const file of project.files) {
    const rel = normalizePath(file.path);
    const dest = join(root, rel);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, fileContentToBuffer(file));
  }

  if (project.theme) {
    const themeDir = join(root, ".themes");
    await mkdir(themeDir, { recursive: true });
    const ext = project.theme.format === "yaml" ? "yml" : "css";
    const themePath = join(themeDir, `custom.${ext}`);
    await writeFile(themePath, project.theme.content, "utf8");
  }

  const attrPath = join(root, ".attributes");
  const attrLines = Object.entries(project.attributes).map(
    ([k, v]) => `:${k}: ${v}`,
  );
  if (project.theme?.format === "yaml") {
    attrLines.push(":pdf-theme: .themes/custom.yml");
  }
  if (project.theme?.format === "css") {
    attrLines.push(":stylesheet: .themes/custom.css");
  }
  await writeFile(attrPath, attrLines.join("\n") + "\n", "utf8");

  return normalizePath(entry);
}

async function compileFormat(
  root: string,
  entry: string,
  format: CompileFormat,
  outDir: string,
): Promise<{ path: string; warnings: string[]; missingAssets: string[] }> {
  const base = entry.replace(/\.adoc$/, "");
  const outputBase = posix.basename(base);
  const warnings: string[] = [];
  const missingAssets: string[] = [];
  const extensionAwareFormat = format;

  if (JRUBY_RUNNER === "persistent") {
    const filename =
      extensionAwareFormat === "html5"
        ? `${outputBase}.html`
        : extensionAwareFormat === "pdf"
          ? `${outputBase}.pdf`
          : extensionAwareFormat === "epub"
            ? `${outputBase}.epub`
            : `${outputBase}.xml`;
    const out = join(outDir, filename);
    const response = await getPersistentJrubyRunner().compile({
      root,
      entry,
      format: extensionAwareFormat,
      output: out,
      attributesFile: join(root, ".attributes"),
    });
    warnings.push(...response.warnings);
    missingAssets.push(...extractMissingAssets(response.warnings.join("\n")));
    if (!response.ok) {
      throw new Error(response.error ?? `Persistent ${format} compile failed`);
    }
    return { path: out, warnings, missingAssets };
  }

  if (format === "html5") {
    const out = join(outDir, `${outputBase}.html`);
    const { code, stderr } = await run(
      ASCIIDOCTOR,
      withExtensions([
        "-a",
        "attributes-file=.attributes",
        "-o",
        out,
        join(root, entry),
      ]),
      root,
    );
    if (stderr) warnings.push(stderr);
    missingAssets.push(...extractMissingAssets(stderr));
    if (code !== 0) throw new Error(`HTML compile failed: ${stderr}`);
    return { path: out, warnings, missingAssets };
  }

  if (format === "pdf") {
    const out = join(outDir, `${outputBase}.pdf`);
    const { code, stderr } = await run(
      ASCIIDOCTOR_PDF,
      withExtensions([
        "-a",
        "attributes-file=.attributes",
        "-o",
        out,
        join(root, entry),
      ]),
      root,
    );
    if (stderr) warnings.push(stderr);
    missingAssets.push(...extractMissingAssets(stderr));
    if (code !== 0) throw new Error(`PDF compile failed: ${stderr}`);
    return { path: out, warnings, missingAssets };
  }

  if (format === "epub") {
    const out = join(outDir, `${outputBase}.epub`);
    const { code, stderr } = await run(
      ASCIIDOCTOR_EPUB,
      withExtensions([
        "-b",
        "epub3",
        "-a",
        "attributes-file=.attributes",
        "-o",
        out,
        join(root, entry),
      ]),
      root,
    );
    if (stderr) warnings.push(stderr);
    missingAssets.push(...extractMissingAssets(stderr));
    if (code !== 0) throw new Error(`EPUB compile failed: ${stderr}`);
    return { path: out, warnings, missingAssets };
  }

  const out = join(outDir, `${outputBase}.xml`);
  const { code, stderr } = await run(
    ASCIIDOCTOR,
    withExtensions([
      "-b",
      "docbook5",
      "-a",
      "attributes-file=.attributes",
      "-o",
      out,
      join(root, entry),
    ]),
    root,
  );
  if (stderr) warnings.push(stderr);
  missingAssets.push(...extractMissingAssets(stderr));
  if (code !== 0) throw new Error(`DocBook compile failed: ${stderr}`);
  return { path: out, warnings, missingAssets };
}

async function collectDiagnostics(
  root: string,
  entry: string,
): Promise<{ warnings: string[]; missingAssets: string[]; previewHtml?: string }> {
  const outDir = join(root, ".diagnostics");
  await mkdir(outDir, { recursive: true });
  const { path, warnings, missingAssets } = await compileFormat(
    root,
    entry,
    "html5",
    outDir,
  );

  return {
    warnings,
    missingAssets,
    previewHtml: await readFile(path, "utf8"),
  };
}

export async function compileProject(
  project: AsciidocProject,
  targets: CompileFormat[],
  artifactsRoot: string,
  jobId: string,
  entryPath?: string,
): Promise<CompileResult> {
  const jobDir = await createJobDir();
  const outDir = join(artifactsRoot, jobId);
  await mkdir(outDir, { recursive: true });

  try {
    const preparedProject = await applyIncludePolicy(project);
    const entry = await writeProject(jobDir, preparedProject, entryPath);
    const projectArchive = await writeProjectArchive(preparedProject, artifactsRoot, jobId);
    const warnings: string[] = [];
    const missingAssets = new Set<string>();
    const outputs: CompileResult["outputs"] = [];
    let previewHtml: string | undefined;

    for (const format of targets) {
      const {
        path,
        warnings: formatWarnings,
        missingAssets: formatMissingAssets,
      } = await compileFormat(jobDir, entry, format, outDir);
      warnings.push(...formatWarnings);
      for (const missingAsset of formatMissingAssets) {
        missingAssets.add(missingAsset);
      }
      const filename = posix.basename(path);
      outputs.push({
        format,
        filename,
        url: `/v1/artifacts/${jobId}/${filename}`,
      });
      if (format === "html5" && !previewHtml) {
        previewHtml = await readFile(path, "utf8");
      }
    }

    return {
      outputs,
      projectArchive: {
        filename: projectArchive.filename,
        url: projectArchive.url,
      },
      warnings,
      missingAssets: [...missingAssets],
      previewHtml,
    };
  } finally {
    await cleanupJobDir(jobDir);
  }
}

export async function validateProject(
  project: AsciidocProject,
  entryPath?: string,
): Promise<Pick<CompileResult, "warnings" | "missingAssets" | "previewHtml">> {
  const jobDir = await createJobDir();

  try {
    const preparedProject = await applyIncludePolicy(project);
    const entry = await writeProject(jobDir, preparedProject, entryPath);
    return collectDiagnostics(jobDir, entry);
  } finally {
    await cleanupJobDir(jobDir);
  }
}
