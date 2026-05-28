import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "section19-runtime.json");
const ITERATIONS = 7;

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
    workerUrl:
      argv.find((arg) => arg.startsWith("--worker-url="))?.split("=")[1] ??
      process.env.WORKER_URL ??
      "http://localhost:8787",
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

async function postCompile(workerUrl, body) {
  const startedAt = performance.now();
  const response = await fetch(`${workerUrl}/v1/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const elapsedMs = performance.now() - startedAt;
  const payload = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    elapsedMs,
    payload,
  };
}

async function main() {
  const { dryRun, workerUrl } = parseArgs(process.argv.slice(2));

  if (dryRun) {
    const report = {
      workerUrl,
      iterations: ITERATIONS,
      dryRun: true,
      note: "Runtime measurement skipped.",
    };
    await mkdir(join(ROOT, "reports"), { recursive: true });
    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Wrote ${REPORT_PATH}`);
    return;
  }

  const compileBody = {
    project: {
      files: [
        {
          path: "index.adoc",
          content: "= Perf Check\n\nA short document.\n",
          encoding: "utf8",
        },
      ],
      attributes: {
        author: "AsciidocCloud",
        revdate: "2026-05-29",
      },
      remoteIncludeAllowlist: [],
    },
    targets: ["html5"],
    entryPath: "index.adoc",
  };

  const runs = [];
  for (let index = 0; index < ITERATIONS; index += 1) {
    const run = await postCompile(workerUrl, compileBody);
    runs.push(run);
    console.log(
      `${run.ok ? "[PASS]" : "[FAIL]"} compile #${index + 1}: ${run.elapsedMs.toFixed(1)}ms status=${run.status}`,
    );
    if (!run.ok) {
      throw new Error(`Compile request failed on iteration ${index + 1}`);
    }
  }

  const durations = runs.map((run) => run.elapsedMs);
  const first = durations[0] ?? 0;
  const warmMedian = percentile(durations.slice(1), 50);
  const p95 = percentile(durations, 95);
  const report = {
    workerUrl,
    iterations: ITERATIONS,
    p50Ms: percentile(durations, 50),
    p95Ms: p95,
    firstCompileMs: first,
    warmMedianMs: warmMedian,
    jvmWarmHeuristicPassed: warmMedian > 0 ? first > warmMedian : false,
    p95Passed: p95 <= 3000,
    runs: durations.map((elapsedMs, index) => ({
      index: index + 1,
      elapsedMs,
    })),
  };

  await mkdir(join(ROOT, "reports"), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${REPORT_PATH}`);

  if (!report.p95Passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
