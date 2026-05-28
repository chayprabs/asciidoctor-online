import type { MetadataRoute } from "next";

const baseUrl = "https://asciidoc.standalone-tool-portfolio.example";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
