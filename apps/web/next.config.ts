import type { NextConfig } from "next";

const workerUrl = process.env.WORKER_URL ?? "http://localhost:8787";
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: http: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  `connect-src 'self' ${workerUrl}`,
  "frame-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@asciidoc-cloud/shared-ui", "@asciidoc-cloud/shared-types"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
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
