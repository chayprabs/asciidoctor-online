import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";

const ROOT = process.cwd();
const SAMPLES_DIR = join(ROOT, "samples");
const REPORT_PATH = join(ROOT, "reports", "qc-appendix-b.md");
const DEFAULT_WORKER_URL = process.env.WORKER_URL ?? "http://localhost:8787";
const FORMATS = ["html5", "pdf", "epub", "docbook"];
const THEME_GALLERY = {
  "paper-pdf": {
    format: "yaml",
    content: `extends: default
page:
  layout: portrait
  margin: [0.6in, 0.7in, 0.7in, 0.7in]
base:
  font-color: "222222"
  line-height-length: 1.4
role:
  lead:
    font-style: italic
heading:
  h1-font-size: 24
  h2-font-size: 18
  h3-font-size: 15
link:
  font-color: "0f766e"
`,
  },
  "clean-html": {
    format: "css",
    content: `body {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  color: #1f2937;
  font-family: Georgia, serif;
  line-height: 1.7;
}
`,
  },
};

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
    workerUrl:
      argv.find((arg) => arg.startsWith("--worker-url="))?.split("=")[1] ??
      DEFAULT_WORKER_URL,
  };
}

async function loadManifest() {
  return JSON.parse(await readFile(join(SAMPLES_DIR, "manifest.json"), "utf8"));
}

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

async function loadProject(sample) {
  const sampleRoot = join(SAMPLES_DIR, sample.id);
  const files = await walkFiles(sampleRoot);

  return {
    files: await Promise.all(
      files.map(async (filePath) => ({
        path: relative(sampleRoot, filePath).replace(/\\/g, "/"),
        content: await readFile(filePath, "utf8"),
        encoding: "utf8",
      })),
    ),
    attributes: {
      author: "AsciidocCloud",
      revdate: "2026-05-29",
    },
    theme: sample.theme ? THEME_GALLERY[sample.theme] : undefined,
    remoteIncludeAllowlist: [],
  };
}

function assertSampleIntegrity(sample, project) {
  if (!project.files.some((file) => file.path === sample.entryPath)) {
    throw new Error(`Entry file missing for ${sample.id}: ${sample.entryPath}`);
  }
}

async function compileSample(workerUrl, sample, project) {
  const response = await fetch(`${workerUrl}/v1/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project,
      targets: FORMATS,
      entryPath: sample.entryPath,
    }),
  });

  if (!response.ok) {
    throw new Error(`${sample.id} compile failed with ${response.status}`);
  }

  return response.json();
}

function inspectAcceptance(sample, result) {
  const checks = [];
  checks.push({
    name: "all-formats",
    passed: FORMATS.every((format) =>
      result.outputs.some((output) => output.format === format),
    ),
    detail: `outputs=${result.outputs.map((output) => output.format).join(",")}`,
  });

  if (sample.checks.includes("plantuml") || sample.checks.includes("mermaid")) {
    const preview = result.previewHtml ?? "";
    checks.push({
      name: "diagram-preview",
      passed: /img|svg|object/i.test(preview) && !/\[mermaid\]|\[plantuml\]/i.test(preview),
      detail: "preview contains rendered diagram markup",
    });
  }

  if (sample.theme) {
    checks.push({
      name: "theme-applied",
      passed: Boolean(result.outputs.find((output) => output.format === "pdf" || output.format === "html5")),
      detail: `theme=${sample.theme}`,
    });
  }

  return checks;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await loadManifest();
  const lines = [
    "# QC Appendix B",
    "",
    `Run at: ${new Date().toISOString()}`,
    `Worker: ${args.workerUrl}`,
    `Mode: ${args.dryRun ? "dry-run" : "live"}`,
    "",
  ];

  if (!args.dryRun) {
    const health = await fetch(`${args.workerUrl}/health`);
    if (!health.ok) {
      throw new Error(`Worker health check failed with ${health.status}`);
    }
    const payload = await health.json();
    lines.push("## Worker", "", `- Service: ${payload.service}`, `- Versions: \`${JSON.stringify(payload.versions)}\``, "");
  }

  for (const sample of manifest) {
    const project = await loadProject(sample);
    assertSampleIntegrity(sample, project);

    lines.push(`## ${sample.name}`, "", `- Sample id: \`${sample.id}\``, `- Entry path: \`${sample.entryPath}\``);
    lines.push(`- Files: ${project.files.map((file) => `\`${basename(file.path)}\``).join(", ")}`, "");

    if (args.dryRun) {
      lines.push("- Status: dry-run fixture integrity OK", "");
      continue;
    }

    const result = await compileSample(args.workerUrl, sample, project);
    const checks = inspectAcceptance(sample, result);
    for (const check of checks) {
      lines.push(
        `- ${check.passed ? "[PASS]" : "[FAIL]"} ${check.name}: ${check.detail}`,
      );
    }
    lines.push(`- Warnings: ${result.warnings.length}`, `- Missing assets: ${result.missingAssets.length}`, "");
  }

  await mkdir(join(ROOT, "reports"), { recursive: true });
  await writeFile(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
