import type { MetadataRoute } from "next";

const baseUrl = "https://asciidoc.standalone-tool-portfolio.example";

const routes = [
  "",
  "/asciidoc-to-pdf",
  "/asciidoc-to-html",
  "/asciidoc-to-epub",
  "/asciidoctor-playground",
  "/asciidoc-mermaid",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
