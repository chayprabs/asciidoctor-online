import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const OUTPUT = join(REPORTS_DIR, "section19-hosted.json");
const REQUIRED_ROUTES = [
  "/",
  "/asciidoc-to-pdf",
  "/asciidoc-to-html",
  "/asciidoc-to-epub",
  "/asciidoctor-playground",
  "/asciidoc-mermaid",
];

function parseArgs(argv) {
  return {
    webUrl:
      argv.find((arg) => arg.startsWith("--web-url="))?.split("=")[1] ??
      process.env.HOSTED_WEB_URL ??
      null,
    apiUrl:
      argv.find((arg) => arg.startsWith("--api-url="))?.split("=")[1] ??
      process.env.HOSTED_API_URL ??
      null,
    dryRun: argv.includes("--dry-run"),
  };
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function checkRoute(baseUrl, route) {
  const response = await fetch(new URL(route, baseUrl));
  return {
    route,
    status: response.status,
    ok: response.ok,
  };
}

async function checkApiHealth(apiUrl) {
  if (!apiUrl) {
    return null;
  }

  try {
    const { response, payload } = await fetchJson(new URL("/health", apiUrl));
    return {
      url: new URL("/health", apiUrl).toString(),
      status: response.status,
      ok: response.ok,
      service: payload?.service ?? null,
    };
  } catch (error) {
    return {
      url: new URL("/health", apiUrl).toString(),
      status: 0,
      ok: false,
      service: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkHostedCompile(webUrl) {
  const payload = {
    project: {
      files: [
        {
          path: "index.adoc",
          content: "= Hosted Check\n\nThis verifies the deployed web-to-worker proxy.\n",
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

  try {
    const { response, payload: body } = await fetchJson(
      new URL("/api/worker/v1/compile", webUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    return {
      url: new URL("/api/worker/v1/compile", webUrl).toString(),
      status: response.status,
      ok: response.ok,
      outputs: Array.isArray(body?.outputs) ? body.outputs.map((item) => item.format) : [],
      warnings: Array.isArray(body?.warnings) ? body.warnings.length : null,
    };
  } catch (error) {
    return {
      url: new URL("/api/worker/v1/compile", webUrl).toString(),
      status: 0,
      ok: false,
      outputs: [],
      warnings: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.dryRun) {
    await mkdir(REPORTS_DIR, { recursive: true });
    await writeFile(
      OUTPUT,
      `${JSON.stringify(
        {
          dryRun: true,
          note: "Set HOSTED_WEB_URL and optionally HOSTED_API_URL to verify a live deployment.",
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    console.log(`Wrote ${OUTPUT}`);
    return;
  }

  if (!args.webUrl) {
    throw new Error("Missing hosted web URL. Pass --web-url=... or set HOSTED_WEB_URL.");
  }

  const routes = await Promise.all(
    REQUIRED_ROUTES.map((route) => checkRoute(args.webUrl, route)),
  );
  const compile = await checkHostedCompile(args.webUrl);
  const apiHealth = await checkApiHealth(args.apiUrl);

  const report = {
    webUrl: args.webUrl,
    apiUrl: args.apiUrl,
    checkedAt: new Date().toISOString(),
    routes,
    compile,
    apiHealth,
    allRoutesPassed: routes.every((route) => route.ok),
    hostedCompilePassed:
      compile.ok && compile.outputs.includes("html5"),
    apiHealthPassed: apiHealth ? apiHealth.ok : null,
  };

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUTPUT}`);

  if (
    !report.allRoutesPassed ||
    !report.hostedCompilePassed ||
    (apiHealth && !report.apiHealthPassed)
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
