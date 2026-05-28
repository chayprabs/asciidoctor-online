import type { Metadata } from "next";
import { LandingPage, buildFaqJsonLd } from "@/components/LandingPage";

const faq = [
  {
    question: "Can I upload an Asciidoctor PDF theme?",
    answer:
      "Yes. Upload a YAML theme in the playground and the worker applies it during PDF compilation so you can iterate on typography, color, and page layout quickly.",
  },
  {
    question: "Does the PDF compile use a warm JRuby worker?",
    answer:
      "Yes. AsciidocCloud keeps the JRuby runtime warm so repeated small-document compiles stay fast instead of paying a cold start every request.",
  },
];

export const metadata: Metadata = {
  title: "AsciiDoc to PDF online",
  description:
    "Compile AsciiDoc to PDF online with Asciidoctor PDF, custom YAML themes, warm JRuby execution, and downloadable artifacts.",
  alternates: {
    canonical: "/asciidoc-to-pdf",
  },
};

export default function AsciiDocToPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(faq)) }}
      />
      <LandingPage
        eyebrow="PDF workflow"
        title="Compile AsciiDoc to PDF online with Asciidoctor PDF themes"
        description="Upload a multi-file AsciiDoc project, preview diagnostics, and export a branded PDF with Asciidoctor-PDF YAML themes in one browser workflow."
        highlights={[
          "Asciidoctor-PDF YAML theme upload and theme gallery presets",
          "Persistent JRuby worker for fast repeated compile cycles",
          "Warnings and missing-asset diagnostics before you download",
          "Project ZIP download for reproducible handoff",
        ]}
        steps={[
          {
            title: "Build your project",
            body: "Create a multi-file AsciiDoc workspace, upload images or fonts, and select the correct entry file before compiling.",
          },
          {
            title: "Apply a PDF theme",
            body: "Choose a gallery preset or upload your own YAML theme to test page masters, fonts, color tokens, and title pages.",
          },
          {
            title: "Export the artifact",
            body: "Compile to PDF, review diagnostics, and download the finished file or the full project ZIP for versioned reuse.",
          },
        ]}
        faq={faq}
      />
    </>
  );
}
