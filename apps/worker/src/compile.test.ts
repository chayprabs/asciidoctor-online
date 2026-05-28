import { describe, expect, it } from "vitest";
import {
  extractMissingAssets,
  fileContentToBuffer,
  pickEntryPath,
} from "./compile.js";

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

  it("extracts missing assets and line numbers from compiler warnings", () => {
    expect(
      extractMissingAssets(
        "asciidoctor: WARNING: index.adoc: line 18: image to embed not found or not readable: assets/logo.png\n" +
          "asciidoctor: WARNING: index.adoc: line 22: include file not found: chapter.adoc",
      ),
    ).toEqual([
      "line 18: image to embed not found or not readable: assets/logo.png",
      "line 22: include file not found: chapter.adoc",
    ]);
  });
});
