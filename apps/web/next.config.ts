import type { NextConfig } from "next";

const workerUrl = process.env.WORKER_URL ?? "http://localhost:8787";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@asciidoc-cloud/shared-ui", "@asciidoc-cloud/shared-types"],
  async rewrites() {
    return [
      {
        source: "/api/worker/:path*",
        destination: `${workerUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
