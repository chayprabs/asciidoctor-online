import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SENSITIVE = /password|secret|token|api[_-]?key/i;

/** Redact secrets from log lines. */
export function redactLogLine(line: string): string {
  if (SENSITIVE.test(line)) {
    return "[REDACTED]";
  }
  return line;
}

/** Ephemeral per-job workspace directory. */
export async function createJobDir(prefix = "asciidoc-job-"): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

export async function cleanupJobDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

export interface JobLimits {
  maxWallMs: number;
  maxFiles: number;
}

export const DEFAULT_LIMITS: JobLimits = {
  maxWallMs: 120_000,
  maxFiles: 200,
};
