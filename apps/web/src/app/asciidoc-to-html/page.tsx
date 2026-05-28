import type { Metadata } from "next";
import { LandingPage, buildFaqJsonLd } from "@/components/LandingPage";

const faq = [
  {
    question: "Does the HTML preview update as I type?",
    answer:
      "Yes. The playground debounces edits and recompiles the active entry file to HTML so the iframe preview stays responsive while you write.",
  },
  {
    question: "Can I compile a project with includes and assets?",
    answer:
      "Yes. Local includes stay sandboxed inside the uploaded project tree, assets can be uploaded with the files, and remote includes can be enabled per host allowlist.",
  },
];

export const metadata: Metadata = {
  title: "AsciiDoc to HTML online",
  description:
    "Compile AsciiDoc to standalone HTML online with debounced live preview, diagnostics, includes, and downloadable project artifacts.",
  alternates: {
    canonical: "/asciidoc-to-html",
  },
};

export default function AsciiDocToHtmlPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(faq)) }}
      />
      <LandingPage
        eyebrow="HTML workflow"
        title="Compile AsciiDoc to standalone HTML online"
        description="Edit a technical document in the browser, preview the rendered HTML in place, and export the same project to PDF, EPUB, or DocBook when you are ready."
        highlights={[
          "Debounced HTML preview inside the browser playground",
          "Compiler warnings and missing-asset diagnostics surfaced alongside the preview",
          "Remote include allowlist for controlled external includes",
          "Shared multi-file project model across HTML, PDF, EPUB, and DocBook",
        ]}
        steps={[
          {
            title: "Open or load a sample",
            body: "Start from a built-in technical writing sample or create your own document tree with chapter files, assets, and attributes.",
          },
          {
            title: "Preview rendered HTML",
            body: "AsciidocCloud recompiles the active entry file after a short debounce and shows the resulting standalone HTML in an iframe preview.",
          },
          {
            title: "Ship or continue refining",
            body: "Download HTML immediately or keep iterating until the same source is ready for PDF, EPUB, and DocBook output.",
          },
        ]}
        faq={faq}
      />
    </>
  );
}
