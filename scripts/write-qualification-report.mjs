import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const STATUS_PATH = join(REPORTS_DIR, "section19-status.md");
const OUTPUT = join(REPORTS_DIR, "section19-report.md");

function parseArgs(argv) {
  return {
    repoUrl:
      argv.find((arg) => arg.startsWith("--repo-url="))?.split("=")[1] ??
      process.env.REPO_URL ??
      "https://github.com/chayprabs/asciidoctor-online",
    hostedUrl:
      argv.find((arg) => arg.startsWith("--hosted-url="))?.split("=")[1] ??
      process.env.HOSTED_WEB_URL ??
      "BLOCKED: hosted URL not configured",
    verifier:
      argv.find((arg) => arg.startsWith("--verifier="))?.split("=")[1] ??
      process.env.VERIFIER_ID ??
      "codex",
  };
}

function parseStatus(text) {
  const lines = text.split(/\r?\n/);
  const runAt =
    lines.find((line) => line.startsWith("Run at: "))?.replace("Run at: ", "") ??
    new Date().toISOString();
  const evidenceLines = lines.filter((line) => /^- \[(PASS|FAIL|VERIFY-DEFERRED)\]/.test(line));
  const nonVerdictLines = evidenceLines.filter((line) => !line.includes("19.20 Final qualification verdict"));

  const passed = nonVerdictLines.filter((line) => line.startsWith("- [PASS]"));
  const failed = nonVerdictLines.filter((line) => line.startsWith("- [FAIL]"));
  const deferred = nonVerdictLines.filter((line) => line.startsWith("- [VERIFY-DEFERRED]"));

  const verdict =
    failed.length > 0 ? "NOT QUALIFIED" : deferred.length > 0 ? "VERIFY-DEFERRED" : "QUALIFIED";

  return {
    runAt,
    passed,
    failed,
    deferred,
    total: nonVerdictLines.length,
    verdict,
  };
}

function stripPrefix(line) {
  return line.replace(/^- \[(PASS|FAIL|VERIFY-DEFERRED)\]\s*/, "");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const statusText = await readFile(STATUS_PATH, "utf8");
  const parsed = parseStatus(statusText);
  let sha = "unknown";

  try {
    const headRef = await readFile(join(ROOT, ".git", "HEAD"), "utf8");
    if (headRef.startsWith("ref: ")) {
      const refPath = headRef.replace("ref: ", "").trim();
      sha = (await readFile(join(ROOT, ".git", refPath), "utf8")).trim();
    } else {
      sha = headRef.trim();
    }
  } catch {
    // ignore and keep unknown
  }

  const lines = [
    "Tool: AsciidocCloud",
    "Section: 19.Release Qualification Checklist",
    `Repo: ${args.repoUrl}@${sha}`,
    `Hosted: ${args.hostedUrl}`,
    `Run at: ${parsed.runAt}`,
    `Verifier: ${args.verifier}`,
    "",
    "Counts:",
    `  Total checks: ${parsed.total}`,
    `  Passed: ${parsed.passed.length}`,
    `  Failed: ${parsed.failed.length}`,
    "  Blocked: 0",
    `  Verify-deferred: ${parsed.deferred.length}`,
    "Failures:",
  ];

  if (parsed.failed.length === 0) {
    lines.push("  - none");
  } else {
    for (const line of parsed.failed) {
      lines.push(`  - ${stripPrefix(line)}`);
    }
  }

  lines.push("", "Blocked:", "  - none", "", "Verify-deferred:");

  if (parsed.deferred.length === 0) {
    lines.push("  - none");
  } else {
    for (const line of parsed.deferred) {
      lines.push(`  - ${stripPrefix(line)}`);
    }
  }

  lines.push(
    "",
    `Verdict: ${parsed.verdict}`,
    "Action: run hosted deployment verification when live URLs and deploy hooks are available, then regenerate this report before claiming final qualification.",
  );

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(OUTPUT, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
