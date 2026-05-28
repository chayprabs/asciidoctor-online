import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@asciidoc-cloud/shared-types": fileURLToPath(
        new URL("../../packages/shared-types/src/index.ts", import.meta.url),
      ),
      "@asciidoc-cloud/shared-ui": fileURLToPath(
        new URL("../../packages/shared-ui/src/index.tsx", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
  },
});
