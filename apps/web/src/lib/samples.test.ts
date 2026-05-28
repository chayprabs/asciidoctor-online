import { describe, expect, it } from "vitest";
import { SAMPLE_PROJECTS } from "./samples";

describe("SAMPLE_PROJECTS", () => {
  it("covers the four named PRD fixture types", () => {
    expect(SAMPLE_PROJECTS.map((sample) => sample.id)).toEqual([
      "technical-manual",
      "user-guide",
      "book-with-diagrams",
      "reveal-slides",
    ]);
  });

  it("gives every sample an entry file that exists in the project tree", () => {
    for (const sample of SAMPLE_PROJECTS) {
      expect(sample.project.files.some((file) => file.path === sample.entryPath)).toBe(
        true,
      );
    }
  });
});
