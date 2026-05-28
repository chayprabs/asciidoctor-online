import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  THEME_GALLERY,
  type CompileFormat,
} from "@asciidoc-cloud/shared-types";
import { compileProject } from "./compile.js";
import { getToolVersions } from "./tooling.js";

const app = new Hono();
const port = Number(process.env.PORT ?? 8787);
const artifactsRoot = process.env.ARTIFACTS_DIR ?? join(process.cwd(), ".artifacts");

const compileSchema = z.object({
  project: z.object({
    files: z.array(z.object({ path: z.string(), content: z.string() })),
    attributes: z.record(z.string()),
    theme: z
      .object({
        format: z.enum(["yaml", "css"]),
        content: z.string(),
      })
      .optional(),
    remoteIncludeAllowlist: z.array(z.string()).optional(),
  }),
  targets: z.array(z.enum(["html5", "pdf", "epub", "docbook"])),
  entryPath: z.string().optional(),
});

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "asciidoc-cloud-worker",
    asciidoctor: process.env.ASCIIDOCTOR_BIN ?? "asciidoctor",
    versions: getToolVersions(),
  }),
);

app.get("/v1/themes", (c) => c.json({ items: THEME_GALLERY }));
app.get("/v1/tooling", (c) => c.json({ versions: getToolVersions() }));

app.post("/v1/compile", async (c) => {
  const body = await c.req.json();
  const parsed = compileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const jobId = randomUUID();
  try {
    const result = await compileProject(
      parsed.data.project,
      parsed.data.targets as CompileFormat[],
      artifactsRoot,
      jobId,
      parsed.data.entryPath,
    );
    return c.json({ jobId, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Compile failed";
    return c.json({ error: message }, 500);
  }
});

app.get("/v1/artifacts/:jobId/:filename", async (c) => {
  const { jobId, filename } = c.req.param();
  if (filename.includes("..") || jobId.includes("..")) {
    return c.text("Forbidden", 403);
  }
  const path = join(artifactsRoot, jobId, filename);
  try {
    const data = await readFile(path);
    const type = filename.endsWith(".pdf")
      ? "application/pdf"
      : filename.endsWith(".epub")
        ? "application/epub+zip"
        : filename.endsWith(".xml")
          ? "application/xml"
          : "text/html";
    return new Response(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return c.text("Not found", 404);
  }
});

serve({ fetch: app.fetch, port }, () => {
  console.log(`asciidoc-cloud worker listening on :${port}`);
});

export default app;
