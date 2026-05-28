import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AsciidocCloud — AsciiDoc to HTML, PDF and EPUB online",
  description:
    "Compile AsciiDoc to HTML, PDF and EPUB online with Asciidoctor - themes, includes, PlantUML, Mermaid and Graphviz diagrams.",
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
