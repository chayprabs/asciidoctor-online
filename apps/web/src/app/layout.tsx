import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://asciidoc.standalone-tool-portfolio.example"),
  title: {
    default: "AsciidocCloud | AsciiDoc to HTML, PDF, EPUB, and DocBook online",
    template: "%s | AsciidocCloud",
  },
  description:
    "Compile AsciiDoc to HTML, PDF and EPUB online with Asciidoctor - themes, includes, PlantUML, Mermaid and Graphviz diagrams.",
  applicationName: "AsciidocCloud",
  keywords: [
    "asciidoc",
    "asciidoctor",
    "asciidoctor pdf",
    "asciidoc online",
    "docbook",
    "epub",
    "plantuml",
    "mermaid",
    "graphviz",
    "technical writing",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AsciidocCloud",
    description:
      "Compile AsciiDoc to HTML, PDF, EPUB, and DocBook online with themes, diagnostics, includes, and diagram extensions.",
    url: "https://asciidoc.standalone-tool-portfolio.example",
    siteName: "AsciidocCloud",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AsciidocCloud",
    description:
      "Online AsciiDoc compilation with Asciidoctor, PDF themes, includes, and diagram rendering.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
