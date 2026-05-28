import { describe, expect, it } from "vitest";
import { redactLogLine } from "./index.js";

describe("redactLogLine", () => {
  it("redacts password-like content", () => {
    expect(redactLogLine("user password=abc123")).toBe("[REDACTED]");
  });

  it("passes normal lines through", () => {
    expect(redactLogLine("compiled index.adoc")).toBe("compiled index.adoc");
  });
});
