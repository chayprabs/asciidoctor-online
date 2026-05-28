import { describe, expect, it } from "vitest";
import type { AsciidocProject } from "./index.js";

describe("AsciidocProject", () => {
  it("accepts minimal project shape", () => {
    const project: AsciidocProject = {
      files: [{ path: "index.adoc", content: "= Hello\n" }],
      attributes: { title: "Hello" },
    };
    expect(project.files).toHaveLength(1);
  });
});
