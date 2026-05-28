import type { Metadata } from "next";
import { Playground } from "@/components/Playground";

export const metadata: Metadata = {
  title: "AsciiDoc to HTML, PDF, EPUB, and DocBook online",
  description:
    "Compile AsciiDoc online with a multi-file playground, PDF themes, HTML CSS themes, remote include allowlists, and PlantUML or Mermaid diagram support.",
};

export default function HomePage() {
  return <Playground />;
}
