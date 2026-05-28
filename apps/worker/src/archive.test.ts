import { access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { writeProjectArchive } from "./archive.js";

describe("writeProjectArchive", () => {
  it("writes a project zip artifact for the compile result", async () => {
    const jobId = `job-${Date.now()}`;
    const artifactsRoot = join(tmpdir(), "asciidoc-cloud-tests");
    const archive = await writeProjectArchive(
      {
        files: [{ path: "index.adoc", content: "= Hello\n", encoding: "utf8" }],
        attributes: { author: "Ada" },
        theme: { format: "css", content: "body { color: red; }" },
      },
      artifactsRoot,
      jobId,
    );

    await expect(access(archive.path)).resolves.toBeUndefined();
    expect(archive.filename).toBe(`${jobId}-project.zip`);
    expect(archive.url).toBe(`/v1/artifacts/${jobId}/${jobId}-project.zip`);
  });
});
