FROM jruby:9.4-jdk17

RUN apt-get update && apt-get install -y --no-install-recommends \
    graphviz \
    plantuml \
    ditaa \
    python3 \
    python3-pip \
    ca-certificates \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN gem install \
    asciidoctor:2.0.23 \
    asciidoctor-pdf:2.3.19 \
    asciidoctor-epub3:2.2.0 \
    asciidoctor-diagram:3.0.1

RUN npm install --global @mermaid-js/mermaid-cli@11.12.0 \
    && pip3 install --no-cache-dir blockdiag==3.0.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages/shared-types packages/shared-types
COPY packages/shared-worker-runtime packages/shared-worker-runtime
COPY apps/worker apps/worker

RUN corepack enable \
    && corepack prepare pnpm@10.33.1 --activate \
    && pnpm install --frozen-lockfile || pnpm install \
    && pnpm --filter @asciidoc-cloud/worker build

ENV ASCIIDOCTOR_BIN=asciidoctor
ENV ASCIIDOCTOR_PDF_BIN=asciidoctor-pdf
ENV ASCIIDOCTOR_EPUB_BIN=asciidoctor-epub3
ENV ASCIIDOCTOR_REQUIRE_PATHS=asciidoctor-diagram
ENV MERMAID_BIN=mmdc
ENV GRAPHVIZ_BIN=dot
ENV BLOCKDIAG_BIN=blockdiag
ENV PORT=8787
ENV ARTIFACTS_DIR=/tmp/artifacts

EXPOSE 8787

CMD ["node", "apps/worker/dist/index.js"]
