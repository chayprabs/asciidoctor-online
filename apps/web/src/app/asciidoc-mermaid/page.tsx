import type { Metadata } from "next";
import { LandingPage, buildFaqJsonLd } from "@/components/LandingPage";

const faq = [
  {
    question: "Which diagram engines are available?",
    answer:
      "The worker is designed to support PlantUML, Mermaid, Graphviz, BlockDiag, and Ditaa so technical writing teams can validate multiple diagram styles from one AsciiDoc project.",
  },
  {
    question: "Why use an online Mermaid playground for AsciiDoc?",
    answer:
      "It removes the local setup friction around JRuby, Mermaid CLI, and headless browser dependencies while keeping the rendered result close to production output.",
  },
];

export const metadata: Metadata = {
  title: "AsciiDoc Mermaid diagrams",
  description:
    "Render Mermaid diagrams inside AsciiDoc online with the Asciidoctor diagram extension pipeline and downloadable output artifacts.",
  alternates: {
    canonical: "/asciidoc-mermaid",
  },
};

export default function AsciiDocMermaidPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(faq)) }}
      />
      <LandingPage
        eyebrow="Diagram workflow"
        title="Render Mermaid diagrams inside AsciiDoc online"
        description="Test Mermaid blocks inside a real AsciiDoc project, inspect diagnostics, and export the rendered document to the formats your team ships."
        highlights={[
          "Mermaid rendering through the Asciidoctor diagram extension pipeline",
          "Sample projects that exercise multiple diagram engines",
          "HTML preview plus PDF, EPUB, and DocBook output downloads",
          "Include policy and theme settings preserved across diagram-heavy documents",
        ]}
        steps={[
          {
            title: "Paste or upload diagram content",
            body: "Write Mermaid blocks directly in the editor or load the technical-manual sample to see a diagram-enabled project immediately.",
          },
          {
            title: "Compile and inspect output",
            body: "The worker resolves the diagram engine, compiles the AsciiDoc source, and returns preview HTML along with any warnings or missing assets.",
          },
          {
            title: "Publish with confidence",
            body: "Download the rendered artifact or keep iterating until the same source is ready for a PDF, EPUB, or DocBook publishing step.",
          },
        ]}
        faq={faq}
      />
    </>
  );
}
