# AsciidocCloud (`asciidoctor-online`)

Compile **AsciiDoc to HTML, PDF and EPUB online** with Asciidoctor, themes,
includes, PlantUML, Mermaid, and Graphviz diagrams.

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

## Monorepo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js 15 playground |
| `apps/worker` | Hono API and Asciidoctor compile service |
| `packages/shared-*` | Types, UI primitives, and job runtime helpers |
| `samples/` | Acceptance fixtures |

## API

- `POST /v1/compile` project plus targets to outputs and preview HTML.
- `GET /v1/themes` built-in YAML and CSS theme gallery.
- `GET /v1/tooling` reported compiler and extension versions.
- `GET /health` worker health with cached tool versions.

## Verification

- `pnpm verify:samples:dry-run` validates the acceptance fixture inventory and
  writes `reports/qc-appendix-b.md`.
- `pnpm verify:samples` runs the sample compile harness against a live worker at
  `WORKER_URL` or `http://localhost:8787`.

## License

AGPL-3.0. See [LICENSE](LICENSE).

## Self-host

Run `docker compose up` on a clean machine with Docker 24+.
