FROM jruby:9.4-jdk17

RUN apt-get update && apt-get install -y --no-install-recommends \
    graphviz \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN gem install asciidoctor:2.0.23 asciidoctor-pdf:2.3.19 asciidoctor-epub3:2.2.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages/shared-types packages/shared-types
COPY packages/shared-worker-runtime packages/shared-worker-runtime
COPY apps/worker apps/worker

RUN curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=10.33.1 sh - \
    && export PNPM_HOME="/root/.local/share/pnpm" \
    && export PATH="$PNPM_HOME:$PATH" \
    && pnpm install --frozen-lockfile || pnpm install \
    && pnpm --filter @asciidoc-cloud/worker build

ENV ASCIIDOCTOR_BIN=asciidoctor
ENV ASCIIDOCTOR_PDF_BIN=asciidoctor-pdf
ENV PORT=8787
ENV ARTIFACTS_DIR=/tmp/artifacts

EXPOSE 8787

CMD ["node", "apps/worker/dist/index.js"]
