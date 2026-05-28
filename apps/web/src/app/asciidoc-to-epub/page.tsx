import type { Metadata } from "next";
import { LandingPage, buildFaqJsonLd } from "@/components/LandingPage";

const faq = [
  {
    question: "Can I generate EPUB from the same source as PDF and HTML?",
    answer:
      "Yes. AsciidocCloud compiles the same project into HTML, PDF, EPUB, and DocBook, which makes it useful for docs-as-code and technical publishing workflows.",
  },
  {
    question: "Will my book assets stay inside the project?",
    answer:
      "Yes. Uploaded assets remain part of the project tree, and the project ZIP download preserves the same file layout for local publishing or CI use later.",
  },
];

export const metadata: Metadata = {
  title: "AsciiDoc to EPUB online",
  description:
    "Compile AsciiDoc to EPUB3 online with Asciidoctor EPUB3, shared project files, and downloadable multi-format artifacts.",
  alternates: {
    canonical: "/asciidoc-to-epub",
  },
};

export default function AsciiDocToEpubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(faq)) }}
      />
      <LandingPage
        eyebrow="EPUB workflow"
        title="Export AsciiDoc to EPUB3 online"
        description="Use Asciidoctor EPUB3 from the browser to package a manual, guide, or training book into an EPUB artifact without setting up JRuby locally."
        highlights={[
          "EPUB3 generation from the same project used for HTML and PDF",
          "Book-oriented multi-file samples for manuals and guides",
          "Theme, attributes, and includes shared across output formats",
          "Project ZIP download for portable publishing workflows",
        ]}
        steps={[
          {
            title: "Prepare the book structure",
            body: "Split the content into chapters, appendices, and assets so the EPUB output follows the same source layout as your other published formats.",
          },
          {
            title: "Compile through the worker",
            body: "The worker runs Asciidoctor EPUB3 with the project attributes and include policy, then reports warnings or missing assets back to the UI.",
          },
          {
            title: "Download the package",
            body: "Grab the generated EPUB, compare it against the HTML preview, and keep the project ZIP for future releases or repository import.",
          },
        ]}
        faq={faq}
      />
    </>
  );
}
