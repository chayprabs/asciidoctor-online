import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@asciidoc-cloud/shared-types": fileURLToPath(
        new URL("../../packages/shared-types/src/index.ts", import.meta.url),
      ),
      "@asciidoc-cloud/shared-worker-runtime": fileURLToPath(
        new URL(
          "../../packages/shared-worker-runtime/src/index.ts",
          import.meta.url,
        ),
      ),
    },
  },
  test: {
    environment: "node",
  },
});
