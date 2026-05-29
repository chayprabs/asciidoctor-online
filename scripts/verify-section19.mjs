import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const OUTPUT = join(REPORTS_DIR, "section19-status.md");

async function maybeReadJson(file) {
  try {
    return JSON.parse(await readFile(join(REPORTS_DIR, file), "utf8"));
  } catch {
    return null;
  }
}

async function maybeReadText(file) {
  try {
    return await readFile(join(REPORTS_DIR, file), "utf8");
  } catch {
    return null;
  }
}

async function dockerAvailable() {
  try {
    await execFile("docker", ["version"], { cwd: ROOT, timeout: 30000 });
    return true;
  } catch {
    return false;
  }
}

function verdictLabel(status) {
  return status === "pass"
    ? "[PASS]"
    : status === "deferred"
      ? "[VERIFY-DEFERRED]"
      : "[FAIL]";
}

function sectionLine(label, status, detail) {
  return `- ${verdictLabel(status)} ${label}: ${detail}`;
}

async function main() {
  const ci = await maybeReadJson("section19-ci.json");
  const hosted = await maybeReadJson("section19-hosted.json");
  const hostedConfig = await maybeReadJson("section19-hosted-config.json");
  const runtime = await maybeReadJson("section19-runtime.json");
  const runtimeEvidence =
    typeof runtime?.p95Ms === "number" && typeof runtime?.warmMedianMs === "number"
      ? runtime
      : ci?.runtime ?? null;
  const lighthouse = await maybeReadJson("lighthouse-summary.json");
  const appendixB = await maybeReadText("qc-appendix-b.md");
  const dockerOk = await dockerAvailable();
  const hostedConfigDetail =
    hostedConfig && hostedConfig.ready === false
      ? `Missing variables: ${hostedConfig.missingVariables.join(", ") || "none"}; missing secrets: ${hostedConfig.missingSecrets.join(", ") || "none"}.`
      : null;

  const lines = [
    "# Section 19 Status",
    "",
    `Run at: ${new Date().toISOString()}`,
    "",
    "## Current evidence",
    "",
  ];

  if (runtimeEvidence) {
    lines.push(
      sectionLine(
        "19.2 Persistent JRuby warm worker",
        runtimeEvidence.jvmWarmHeuristicPassed ? "pass" : "fail",
        `warmMedian=${runtimeEvidence.warmMedianMs}ms firstCompile=${runtimeEvidence.firstCompileMs}ms`,
      ),
    );
    lines.push(
      sectionLine(
        "19.13 p95 compile small doc <= 3s",
        runtimeEvidence.p95Passed ? "pass" : "fail",
        `p95=${runtimeEvidence.p95Ms}ms`,
      ),
    );
  } else {
    lines.push(sectionLine("19.2/19.13 Runtime evidence", "fail", "section19-runtime.json missing"));
  }

  if (appendixB) {
    const allFormatsPass = appendixB.includes("[PASS] all-formats");
    const diagramPass = appendixB.includes("[PASS] diagram-preview");
    const themePass = appendixB.includes("[PASS] theme-applied");
    lines.push(
      sectionLine(
        "19.19 A1 Samples compile to all formats",
        allFormatsPass ? "pass" : "fail",
        "See reports/qc-appendix-b.md",
      ),
    );
    lines.push(
      sectionLine(
        "19.19 A2 PlantUML/Mermaid diagrams render",
        diagramPass ? "pass" : "fail",
        "See reports/qc-appendix-b.md",
      ),
    );
    lines.push(
      sectionLine(
        "19.19 A3 Theme upload applies",
        themePass ? "pass" : "fail",
        "See reports/qc-appendix-b.md",
      ),
    );
  } else {
    lines.push(sectionLine("19.19 Acceptance fixtures", "fail", "qc-appendix-b.md missing"));
  }

  if (Array.isArray(lighthouse) && lighthouse.length) {
    for (const item of lighthouse) {
      const allGreen = Object.values(item.categories).every((score) => score >= 95);
      lines.push(
        sectionLine(
          `19.13 Lighthouse ${item.url}`,
          allGreen ? "pass" : "fail",
          JSON.stringify(item.categories),
        ),
      );
    }
  } else {
    lines.push(sectionLine("19.13 Lighthouse", "fail", "lighthouse-summary.json missing"));
  }

  if (ci) {
    lines.push(
      sectionLine(
        "19.1 Worker image <= 1.5 GB",
        ci.image.sizeBytes <= 1610612736 ? "pass" : "fail",
        `${ci.image.sizeMb} MB (${ci.image.sizeBytes} bytes) via ${ci.runUrl}`,
      ),
    );
    lines.push(
      sectionLine(
        "19.3 Worker container health and versions reported",
        ci.workerJob.conclusion === "success" ? "pass" : "fail",
        `${ci.workerJob.url}`,
      ),
    );
    lines.push(
      sectionLine(
        "19.16 Worker image with JRuby + diagram tools pushed",
        ci.publishJob.conclusion === "success" ? "pass" : "fail",
        `${ci.image.repository}:sha-${ci.headSha} via ${ci.publishJob.url}`,
      ),
    );
  } else {
    lines.push(sectionLine("19.1/19.3/19.16 CI publication evidence", "fail", "section19-ci.json missing"));
  }
  lines.push(
    sectionLine(
      "19.3 Local docker compose up healthy",
      dockerOk ? "fail" : "deferred",
      dockerOk
        ? "Docker is available; rerun docker compose up verification explicitly."
        : "Docker Desktop Linux engine unavailable on this host.",
    ),
  );
  lines.push(
    sectionLine(
      "19.18 Hosted routes",
      hosted?.allRoutesPassed ? "pass" : "deferred",
      hosted?.allRoutesPassed
        ? `${hosted.webUrl} ${hosted.routes.map((route) => `${route.route}=${route.status}`).join(", ")}`
        : hostedConfigDetail
          ? `Run verify:hosted with a deployed web URL. ${hostedConfigDetail}`
          : "Run verify:hosted with a deployed web URL.",
    ),
  );
  lines.push(
    sectionLine(
      "19.16 Hosted URLs and pushed worker image",
      hosted?.hostedCompilePassed && (hosted.apiHealthPassed ?? true) ? "pass" : "deferred",
      hosted?.hostedCompilePassed
        ? `${hosted.compile.url} status=${hosted.compile.status}${hosted.apiHealth ? ` api=${hosted.apiHealth.url} status=${hosted.apiHealth.status}` : ""}`
        : hostedConfigDetail
          ? `Hosted deployment not yet verified in current evidence. ${hostedConfigDetail}`
          : "Hosted deployment not yet verified in current evidence.",
    ),
  );
  lines.push(
    sectionLine(
      "19.20 Final qualification verdict",
      "fail",
      "Section 19 is not yet fully green.",
    ),
  );

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(OUTPUT, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
