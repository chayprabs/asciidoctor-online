import { describe, expect, it } from "vitest";
import { fileContentToBuffer, pickEntryPath } from "./compile.js";

describe("compile helpers", () => {
  it("prefers the requested entry path when it exists", () => {
    expect(
      pickEntryPath(
        {
          files: [
            { path: "book/index.adoc", content: "= Book" },
            { path: "book/chapter.adoc", content: "== Chapter" },
          ],
          attributes: {},
        },
        "book/chapter.adoc",
      ),
    ).toBe("book/chapter.adoc");
  });

  it("falls back to the first asciidoc file when no entry is requested", () => {
    expect(
      pickEntryPath(
        {
          files: [
            { path: "assets/logo.svg", content: "<svg />" },
            { path: "index.adoc", content: "= Hello" },
          ],
          attributes: {},
        },
      ),
    ).toBe("index.adoc");
  });

  it("decodes base64 assets without corrupting binary bytes", () => {
    expect(
      fileContentToBuffer({
        path: "assets/logo.bin",
        content: "AAEC",
        encoding: "base64",
      }),
    ).toEqual(Buffer.from([0, 1, 2]));
  });
});
