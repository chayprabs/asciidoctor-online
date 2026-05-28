import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import lighthouse from "lighthouse";

const DEFAULT_URLS = [
  "http://localhost:3000/",
  "http://localhost:3000/asciidoc-to-pdf",
];
const REPORTS_DIR = "reports";
const TMP_DIR = ".tmp/lighthouse";
const DEBUGGING_PORT = Number(process.env.LIGHTHOUSE_PORT ?? "9222");
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

async function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.LIGHTHOUSE_CHROME_PATH,
    join(
      process.cwd(),
      ".cache",
      "browsers",
      "chrome-headless-shell",
      "win64-149.0.7827.22",
      "chrome-headless-shell-win64",
      "chrome-headless-shell.exe",
    ),
    process.env.ProgramFiles
      ? `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`
      : undefined,
    process.env["ProgramFiles(x86)"]
      ? `${process.env["ProgramFiles(x86)"]}\\Google\\Chrome\\Application\\chrome.exe`
      : undefined,
    process.env.LocalAppData
      ? `${process.env.LocalAppData}\\Google\\Chrome\\Application\\chrome.exe`
      : undefined,
    process.env.ProgramFiles
      ? `${process.env.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe`
      : undefined,
    process.env["ProgramFiles(x86)"]
      ? `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`
      : undefined,
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }

  return null;
}

async function waitForHttp(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null) {
    return;
  }

  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

function slugForUrl(url) {
  const { pathname } = new URL(url);
  if (pathname === "/") {
    return "home";
  }
  return pathname.replace(/^\/+/, "").replace(/[\/]+/g, "-");
}

function summarizeCategories(lhr) {
  return Object.fromEntries(
    Object.entries(lhr.categories).map(([key, value]) => [
      key,
      Math.round((value.score ?? 0) * 100),
    ]),
  );
}

const chromePath = await findChromePath();
if (!chromePath) {
  throw new Error("Could not find a Chrome or Edge executable. Set CHROME_PATH.");
}

const urls = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_URLS;

await mkdir(REPORTS_DIR, { recursive: true });
await rm(TMP_DIR, { recursive: true, force: true });
await mkdir(TMP_DIR, { recursive: true });

const chrome = spawn(
  chromePath,
  [
    `--remote-debugging-port=${DEBUGGING_PORT}`,
    `--user-data-dir=${join(process.cwd(), TMP_DIR, "profile")}`,
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
    "--no-first-run",
    "--no-default-browser-check",
    "--incognito",
    "about:blank",
  ],
  {
    stdio: "ignore",
    windowsHide: true,
  },
);

try {
  await waitForHttp(`http://127.0.0.1:${DEBUGGING_PORT}/json/version`, 15000);

  const summary = [];
  for (const url of urls) {
    await waitForHttp(url, 15000);
    const result = await lighthouse(url, {
      port: DEBUGGING_PORT,
      output: "json",
      logLevel: "error",
      onlyCategories: CATEGORIES,
      disableStorageReset: true,
    });

    if (!result?.lhr || typeof result.report !== "string") {
      throw new Error(`Lighthouse did not return a report for ${url}`);
    }

    const slug = slugForUrl(url);
    const reportPath = join(REPORTS_DIR, `lighthouse-${slug}.json`);
    const categories = summarizeCategories(result.lhr);
    await writeFile(reportPath, result.report);
    summary.push({
      url,
      browserPath: chromePath,
      reportPath,
      categories,
      runWarnings: result.lhr.runWarnings,
      passed: Object.values(categories).every((score) => score >= 95),
    });
    console.log(`${slug}: ${JSON.stringify(categories)}`);
  }

  const summaryPath = join(REPORTS_DIR, "lighthouse-summary.json");
  await writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote ${summaryPath}`);
} finally {
  chrome.kill("SIGKILL");
  await waitForExit(chrome, 5000);
  try {
    await rm(TMP_DIR, { recursive: true, force: true });
  } catch (error) {
    console.warn(
      `cleanup warning: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
