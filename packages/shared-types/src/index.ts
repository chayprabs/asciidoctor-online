export type ThemeFormat = "yaml" | "css";
export type FileEncoding = "utf8" | "base64";

export interface ProjectFile {
  path: string;
  content: string;
  encoding?: FileEncoding;
  mediaType?: string;
}

export interface AsciidocProject {
  files: ProjectFile[];
  attributes: Record<string, string>;
  theme?: { format: ThemeFormat; content: string };
  /** Opt-in remote include hosts (https only). */
  remoteIncludeAllowlist?: string[];
}

export type CompileFormat = "html5" | "pdf" | "epub" | "docbook";

export interface CompileOutput {
  format: CompileFormat;
  url: string;
  filename: string;
}

export interface CompileResult {
  outputs: CompileOutput[];
  warnings: string[];
  missingAssets: string[];
  previewHtml?: string;
}

export interface CompileRequest {
  project: AsciidocProject;
  targets: CompileFormat[];
  entryPath?: string;
}

export interface ThemeGalleryItem {
  id: string;
  name: string;
  format: ThemeFormat;
  description: string;
  content: string;
}

export const COMMON_ATTRIBUTE_KEYS = ["title", "author", "revdate"] as const;

export const THEME_GALLERY: ThemeGalleryItem[] = [
  {
    id: "paper-pdf",
    name: "Paper PDF",
    format: "yaml",
    description: "Warm document styling for Asciidoctor PDF output.",
    content: `extends: default
page:
  layout: portrait
  margin: [0.6in, 0.7in, 0.7in, 0.7in]
base:
  font-color: "222222"
  line-height-length: 1.4
role:
  lead:
    font-style: italic
heading:
  h1-font-size: 24
  h2-font-size: 18
  h3-font-size: 15
link:
  font-color: "0f766e"
`,
  },
  {
    id: "midnight-html",
    name: "Midnight HTML",
    format: "css",
    description: "Dark HTML preview styling with high contrast code blocks.",
    content: `body {
  background: #07111f;
  color: #e5eef8;
  font-family: "Segoe UI", sans-serif;
}

a {
  color: #7dd3fc;
}

pre, code {
  background: #0f172a;
  border-radius: 10px;
}

h1, h2, h3 {
  color: #f8fafc;
}
`,
  },
  {
    id: "clean-html",
    name: "Clean HTML",
    format: "css",
    description: "Light HTML styling for readable manuals and user guides.",
    content: `body {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  color: #1f2937;
  font-family: Georgia, serif;
  line-height: 1.7;
}

h1, h2, h3 {
  color: #111827;
}

pre {
  background: #f3f4f6;
  border-radius: 12px;
  padding: 1rem;
}
`,
  },
];
