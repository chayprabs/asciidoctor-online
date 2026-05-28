FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages packages
COPY apps/web apps/web
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm --filter @asciidoc-cloud/web build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=deps /app/apps/web/.next/standalone ./
COPY --from=deps /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=deps /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
