import { execFile as execFileCallback } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const OUTPUT = join(REPORTS_DIR, "section19-hosted-config.json");
const REQUIRED_VARIABLES = ["HOSTED_WEB_URL", "HOSTED_API_URL"];
const REQUIRED_SECRETS = ["RENDER_WEB_DEPLOY_HOOK", "RENDER_WORKER_DEPLOY_HOOK"];

async function gh(args) {
  const { stdout } = await execFile("gh", args, {
    cwd: ROOT,
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}

function parseNames(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean);
}

async function main() {
  const [variableOutput, secretOutput] = await Promise.all([
    gh(["variable", "list"]),
    gh(["secret", "list"]),
  ]);

  const variables = parseNames(variableOutput);
  const secrets = parseNames(secretOutput);
  const missingVariables = REQUIRED_VARIABLES.filter((name) => !variables.includes(name));
  const missingSecrets = REQUIRED_SECRETS.filter((name) => !secrets.includes(name));
  const report = {
    checkedAt: new Date().toISOString(),
    variablesPresent: REQUIRED_VARIABLES.filter((name) => variables.includes(name)),
    secretsPresent: REQUIRED_SECRETS.filter((name) => secrets.includes(name)),
    missingVariables,
    missingSecrets,
    ready: missingVariables.length === 0 && missingSecrets.length === 0,
  };

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (report.ready) {
    console.log("Hosted deploy configuration is ready.");
  } else {
    console.log(
      `Hosted deploy configuration is incomplete. Missing variables: ${missingVariables.join(", ") || "none"}. Missing secrets: ${missingSecrets.join(", ") || "none"}.`,
    );
  }
  console.log(`Wrote ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
