import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Asciidoctor playground",
  description:
    "Open the AsciidocCloud playground to edit multi-file AsciiDoc projects, preview HTML, and download PDF, EPUB, DocBook, or project ZIP artifacts.",
  alternates: {
    canonical: "/asciidoctor-playground",
  },
};

export default function AsciidoctorPlaygroundPage() {
  redirect("/");
}
