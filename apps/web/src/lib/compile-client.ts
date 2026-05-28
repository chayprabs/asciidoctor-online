import type { AsciidocProject, CompileFormat, CompileResult } from "@asciidoc-cloud/shared-types";

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
