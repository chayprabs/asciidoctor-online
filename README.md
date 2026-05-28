# AsciidocCloud (`asciidoctor-online`)

Compile **AsciiDoc to HTML, PDF and EPUB online** with Asciidoctor — themes, includes, PlantUML, Mermaid and Graphviz diagrams.

AsciidocCloud is a Pattern-1 (server-side) playground: a Next.js web UI talks to a sandboxed worker that runs JRuby + Asciidoctor toolchains in ephemeral per-job directories.

## Quick start

```bash
pnpm install
pnpm -r build
pnpm --filter @asciidoc-cloud/worker dev   # :8787
pnpm --filter @asciidoc-cloud/web dev      # :3000
```

Or with Docker:

```bash
docker compose up --build
```

Open http://localhost:3000

## Monorepo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js 15 playground |
| `apps/worker` | Hono API + Asciidoctor compile |
| `packages/shared-*` | Types, UI primitives, job runtime |
| `samples/` | Acceptance fixtures |

## API

- `POST /v1/compile` — project + targets → outputs + preview HTML
- `GET /health` — worker health

## License

AGPL-3.0 — see [LICENSE](LICENSE).

## Self-host

`docker compose up` on a clean machine with Docker 24+.
