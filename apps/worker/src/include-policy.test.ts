import { afterEach, describe, expect, it, vi } from "vitest";
import { applyIncludePolicy } from "./include-policy.js";

describe("applyIncludePolicy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects local include paths that escape the project root", async () => {
    await expect(
      applyIncludePolicy({
        files: [{ path: "index.adoc", content: "include::../secret.adoc[]\n" }],
        attributes: {},
      }),
    ).rejects.toThrow("Sandbox violation");
  });

  it("stages allowlisted remote includes into the project", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "== Remote section\n",
      }),
    );

    const project = await applyIncludePolicy({
      files: [
        {
          path: "index.adoc",
          content: "include::https://docs.example.com/chapter.adoc[]\n",
        },
      ],
      attributes: {},
      remoteIncludeAllowlist: ["docs.example.com"],
    });

    expect(project.files.some((file) => file.path.startsWith(".remote-includes/docs.example.com/"))).toBe(true);
    expect(project.files[0]?.content).toMatch(/include::\.remote-includes\/docs\.example\.com\//);
  });

  it("rejects remote include hosts that are not allowlisted", async () => {
    await expect(
      applyIncludePolicy({
        files: [
          {
            path: "index.adoc",
            content: "include::https://evil.example/steal.adoc[]\n",
          },
        ],
        attributes: {},
        remoteIncludeAllowlist: ["docs.example.com"],
      }),
    ).rejects.toThrow("Remote include host not allowlisted");
  });
});
