import { execFile as execFileCallback } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const OUTPUT = join(REPORTS_DIR, "section19-ci.json");

function parseArgs(argv) {
  return {
    branch:
      argv.find((arg) => arg.startsWith("--branch="))?.split("=")[1] ??
      process.env.GITHUB_BRANCH ??
      "cursor/asciidoc-cloud-build",
    owner:
      argv.find((arg) => arg.startsWith("--owner="))?.split("=")[1] ??
      process.env.GITHUB_OWNER ??
      "chayprabs",
    repo:
      argv.find((arg) => arg.startsWith("--repo="))?.split("=")[1] ??
      process.env.GITHUB_REPO ??
      "asciidoctor-online",
    runId:
      argv.find((arg) => arg.startsWith("--run-id="))?.split("=")[1] ??
      null,
  };
}

async function gh(args) {
  const { stdout } = await execFile("gh", args, {
    cwd: ROOT,
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}

async function resolveRunId(args) {
  if (args.runId) {
    return args.runId;
  }

  const stdout = await gh([
    "run",
    "list",
    "--branch",
    args.branch,
    "--workflow",
    "CI",
    "--limit",
    "10",
    "--json",
    "databaseId,headSha,status,conclusion",
  ]);
  const runs = JSON.parse(stdout);
  const successfulRun = runs.find(
    (run) => run.status === "completed" && run.conclusion === "success",
  );

  if (!successfulRun) {
    throw new Error(`No successful CI run found for branch ${args.branch}`);
  }

  return String(successfulRun.databaseId);
}

function findJob(run, name) {
  const job = run.jobs.find((entry) => entry.name === name);
  if (!job) {
    throw new Error(`Missing ${name} job in run ${run.databaseId}`);
  }
  return job;
}

function extractImageSize(logText) {
  const match = logText.match(/Worker image size: (\d+) MB \((\d+) bytes\)/);
  if (!match) {
    throw new Error("Unable to find worker image size in CI logs");
  }

  return {
    sizeMb: Number(match[1]),
    sizeBytes: Number(match[2]),
  };
}

function percentile(values, p) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

function extractRuntime(logText) {
  const warmupMatch = logText.match(/warm-up compile: ([\d.]+)ms status=200/);
  const measuredMatches = [
    ...logText.matchAll(/measured compile #\d+: ([\d.]+)ms status=200/g),
  ];
  const measuredRuns = measuredMatches.map((match) => Number(match[1]));

  if (!warmupMatch || !measuredRuns.length) {
    throw new Error("Unable to find runtime measurements in CI logs");
  }

  const coldStart = Number(warmupMatch[1]);
  const warmMedian = percentile(measuredRuns, 50);
  const p95 = percentile(measuredRuns, 95);

  return {
    firstCompileMs: coldStart,
    warmMedianMs: warmMedian,
    p95Ms: p95,
    jvmWarmHeuristicPassed: warmMedian > 0 ? coldStart > warmMedian : false,
    p95Passed: p95 <= 3000,
    runs: measuredRuns,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = await resolveRunId(args);
  const run = JSON.parse(
    await gh([
      "run",
      "view",
      runId,
      "--json",
      "databaseId,displayTitle,headSha,jobs,conclusion,url",
    ]),
  );

  const workerJob = findJob(run, "worker-image");
  const publishJob = findJob(run, "publish-worker-image");

  const workerLog = await gh([
    "run",
    "view",
    runId,
    "--job",
    String(workerJob.databaseId),
    "--log",
  ]);
  const imageSize = extractImageSize(workerLog);
  const runtime = extractRuntime(workerLog);

  const report = {
    runId: run.databaseId,
    runTitle: run.displayTitle,
    runUrl: run.url,
    headSha: run.headSha,
    repo: `${args.owner}/${args.repo}`,
    image: {
      repository: `ghcr.io/${args.owner}/asciidoctor-online-worker`,
      tags: [`sha-${run.headSha}`, "edge"],
      sizeMb: imageSize.sizeMb,
      sizeBytes: imageSize.sizeBytes,
    },
    runtime,
    workerJob: {
      id: workerJob.databaseId,
      url: workerJob.url,
      conclusion: workerJob.conclusion,
    },
    publishJob: {
      id: publishJob.databaseId,
      url: publishJob.url,
      conclusion: publishJob.conclusion,
    },
  };

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
