import type { AsciidocProject, CompileFormat, CompileResult } from "@asciidoc-cloud/shared-types";

export interface WorkerHealth {
  ok: boolean;
  service: string;
  asciidoctor: string;
  versions: Record<string, string>;
}

export async function compileProject(
  project: AsciidocProject,
  targets: CompileFormat[],
  entryPath?: string,
): Promise<CompileResult & { jobId?: string }> {
  const res = await fetch("/api/worker/v1/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, targets, entryPath }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Compile failed");
  }
  return data;
}

export async function getWorkerHealth(): Promise<WorkerHealth> {
  const res = await fetch("/api/worker/health", {
    method: "GET",
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Worker health check failed");
  }
  return data;
}
