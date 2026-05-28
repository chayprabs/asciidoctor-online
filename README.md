# AsciidocCloud (`asciidoctor-online`)

Compile **AsciiDoc to HTML, PDF, EPUB, and DocBook online** with Asciidoctor,
themes, includes, PlantUML, Mermaid, Graphviz, BlockDiag, and Ditaa diagrams.

AsciidocCloud is a Pattern-1 server-side playground: a Next.js web UI talks to
a sandboxed worker that runs JRuby and Asciidoctor toolchains in ephemeral
per-job directories.

## Quick start

```bash
pnpm install
pnpm -r build
pnpm --filter @asciidoc-cloud/worker dev
pnpm --filter @asciidoc-cloud/web dev
```

Or with Docker:

```bash
docker compose up --build
```

Open `http://localhost:3000`.

## What it supports

- Multi-file AsciiDoc projects with entry-file selection.
- HTML5, PDF, EPUB, and DocBook output plus project ZIP download.
- Asciidoctor-PDF YAML themes, HTML CSS themes, and a built-in theme gallery.
- Diagram engines: PlantUML, Mermaid, Graphviz, BlockDiag, and Ditaa.
- Sandboxed local includes with opt-in remote include allowlists.
- Warnings and missing-asset diagnostics.

## Screenshot

![AsciidocCloud PDF route screenshot](docs/images/asciidoc-to-pdf.png)

## Monorepo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js 15 playground |
| `apps/worker` | Hono API and Asciidoctor compile service |
| `packages/shared-*` | Types, UI primitives, and job runtime helpers |
| `samples/` | Acceptance fixtures |

## API

- `POST /v1/compile` project plus targets to outputs and preview HTML.
- `POST /v1/validate` diagnostics-only validation for warnings and missing assets.
- `GET /v1/themes` built-in YAML and CSS theme gallery.
- `GET /v1/tooling` reported compiler and extension versions.
- `GET /health` worker health with cached tool versions.

## Verification

- `pnpm verify:preflight` checks Docker, Compose, Node, pnpm, and live worker
  availability before a qualification run.
- `pnpm verify:samples:dry-run` validates the acceptance fixture inventory and
  writes `reports/qc-appendix-b.md`.
- `pnpm verify:samples` runs the sample compile harness against a live worker at
  `WORKER_URL` or `http://localhost:8787`.
- `pnpm verify:runtime:dry-run` writes the Section 19 runtime report scaffold.
- `pnpm verify:runtime` performs one cold-start warm-up compile, then measures
  repeated warm small-doc compile latency and records the warm p95 plus a
  warm-worker heuristic in `reports/section19-runtime.json`.
- `docker compose config` validates the local self-host topology even when the
  Docker daemon is temporarily unavailable.

## License

AGPL-3.0. See [LICENSE](LICENSE).

## Self-host

Run `docker compose up` on a clean machine with Docker 24+.
