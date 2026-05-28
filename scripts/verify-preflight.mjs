import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  return {
    ok: !result.error && result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
    status: result.status ?? 1,
    error: result.error?.message,
  };
}

function parseArgs(argv) {
  return {
    workerUrl:
      argv.find((arg) => arg.startsWith("--worker-url="))?.split("=")[1] ??
      process.env.WORKER_URL ??
      "http://localhost:8787",
  };
}

async function checkWorker(workerUrl) {
  try {
    const response = await fetch(`${workerUrl}/health`);
    if (!response.ok) {
      return { ok: false, detail: `health ${response.status}` };
    }
    const payload = await response.json();
    return {
      ok: true,
      detail: `service=${payload.service}`,
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const { workerUrl } = parseArgs(process.argv.slice(2));
  const checks = [
    {
      name: "docker-cli",
      result: run("docker", ["--version"]),
    },
    {
      name: "docker-compose",
      result: run("docker", ["compose", "version"]),
    },
    {
      name: "docker-daemon",
      result: run("docker", ["info"]),
    },
    {
      name: "node",
      result: run("node", ["--version"]),
    },
    {
      name: "pnpm",
      result: run("pnpm", ["--version"]),
    },
  ];

  for (const check of checks) {
    console.log(
      `${check.result.ok ? "[PASS]" : "[FAIL]"} ${check.name}: ${
        check.result.output || check.result.error || `exit ${check.result.status}`
      }`,
    );
  }

  const worker = await checkWorker(workerUrl);
  console.log(
    `${worker.ok ? "[PASS]" : "[FAIL]"} worker-health: ${workerUrl} ${worker.detail}`,
  );

  if (checks.some((check) => !check.result.ok) || !worker.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
