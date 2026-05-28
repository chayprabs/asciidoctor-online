import { describe, expect, it } from "vitest";
import {
  isEditableFile,
  parseCustomAttributes,
  renameProjectFile,
  serializeCustomAttributes,
} from "./store";

describe("store helpers", () => {
  it("parses custom attributes from equals and colon separators", () => {
    expect(parseCustomAttributes("icons=font\nsectanchors:")).toEqual({
      icons: "font",
      sectanchors: "",
    });
  });

  it("serializes only non-common attributes", () => {
    expect(
      serializeCustomAttributes({
        title: "Manual",
        author: "Ada",
        icons: "font",
        sectanchors: "",
      }),
    ).toBe("icons=font\nsectanchors=");
  });

  it("renames the matching project file only", () => {
    expect(
      renameProjectFile(
        [
          { path: "index.adoc", content: "= Hello" },
          { path: "images/logo.png", content: "abc", encoding: "base64" },
        ],
        "index.adoc",
        "guide/index.adoc",
      ),
    ).toEqual([
      { path: "guide/index.adoc", content: "= Hello" },
      { path: "images/logo.png", content: "abc", encoding: "base64" },
    ]);
  });

  it("marks binary uploads as non-editable", () => {
    expect(
      isEditableFile({
        path: "assets/font.ttf",
        content: "AA==",
        encoding: "base64",
      }),
    ).toBe(false);
  });
});
