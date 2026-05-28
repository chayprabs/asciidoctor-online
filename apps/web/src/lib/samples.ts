import { THEME_GALLERY, type AsciidocProject } from "@asciidoc-cloud/shared-types";

export interface SampleProject {
  id: string;
  name: string;
  description: string;
  entryPath: string;
  project: AsciidocProject;
}

const paperTheme = THEME_GALLERY.find((theme) => theme.id === "paper-pdf");
const cleanTheme = THEME_GALLERY.find((theme) => theme.id === "clean-html");

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "technical-manual",
    name: "Technical manual",
    description: "Manual-style sample with Mermaid and PlantUML diagrams.",
    entryPath: "index.adoc",
    project: {
      files: [
        {
          path: "index.adoc",
          content: `= Technical Manual Sample
:author: AsciidocCloud
:toc:

== Overview

This sample exercises HTML, PDF, EPUB, and DocBook output.

== Diagram (Mermaid)

[mermaid]
....
flowchart LR
  A[AsciiDoc] --> B[Asciidoctor]
  B --> C[HTML/PDF/EPUB]
....

== PlantUML

[plantuml]
....
@startuml
actor User
User -> Asciidoctor : compile
@enduml
....
`,
          encoding: "utf8",
        },
      ],
      attributes: {
        author: "AsciidocCloud",
        revdate: "2026-05-29",
      },
      theme: paperTheme
        ? { format: paperTheme.format, content: paperTheme.content }
        : undefined,
      remoteIncludeAllowlist: [],
    },
  },
  {
    id: "user-guide",
    name: "User guide",
    description: "Two-file project that exercises sandboxed local includes.",
    entryPath: "index.adoc",
    project: {
      files: [
        {
          path: "chapter.adoc",
          content: `== Included chapter

This file is pulled in via \`include::chapter.adoc[]\`.
`,
          encoding: "utf8",
        },
        {
          path: "index.adoc",
          content: `= User Guide
:toc:

== Getting started

Edit \`index.adoc\` in the playground and click *Compile all*.

== Includes

include::chapter.adoc[]
`,
          encoding: "utf8",
        },
      ],
      attributes: {
        author: "Docs Team",
        revdate: "2026-05-29",
      },
      remoteIncludeAllowlist: [],
    },
  },
  {
    id: "book-with-diagrams",
    name: "Book with diagrams",
    description: "Multi-file book sample covering Graphviz, BlockDiag, and Ditaa.",
    entryPath: "book.adoc",
    project: {
      files: [
        {
          path: "appendix.adoc",
          content: `== Appendix

[ditaa]
....
+--------+   +---------+
| Writer |-->| Browser |
+--------+   +---------+
....
`,
          encoding: "utf8",
        },
        {
          path: "book.adoc",
          content: `= Diagram Book
:doctype: book
:toc:

include::chapters/chapter-1.adoc[]

include::appendix.adoc[]
`,
          encoding: "utf8",
        },
        {
          path: "chapters/chapter-1.adoc",
          content: `== Chapter One

[graphviz]
....
digraph G {
  rankdir=LR;
  Author -> Processor -> Output;
}
....

[blockdiag]
....
blockdiag {
  editor -> worker -> outputs;
}
....
`,
          encoding: "utf8",
        },
      ],
      attributes: {
        author: "Sample Author",
        revdate: "2026-05-29",
      },
      theme: paperTheme
        ? { format: paperTheme.format, content: paperTheme.content }
        : undefined,
      remoteIncludeAllowlist: [],
    },
  },
  {
    id: "reveal-slides",
    name: "Reveal.js slides",
    description: "Slide deck sample for the future slides-preview path.",
    entryPath: "slides.adoc",
    project: {
      files: [
        {
          path: "slides.adoc",
          content: `= Launch Slides
:revealjs_theme: white
:revealjs_slideNumber: true

== Why AsciidocCloud?

* Online compile workflow
* Diagram feedback loop
* Theme iteration

== Outputs

* HTML
* PDF
* EPUB
* DocBook
`,
          encoding: "utf8",
        },
      ],
      attributes: {
        author: "Presenter",
        revdate: "2026-05-29",
      },
      theme: cleanTheme
        ? { format: cleanTheme.format, content: cleanTheme.content }
        : undefined,
      remoteIncludeAllowlist: [],
    },
  },
];
