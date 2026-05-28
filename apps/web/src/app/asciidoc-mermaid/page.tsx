import Link from "next/link";

export default function AsciiDocMermaidPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">AsciiDoc Mermaid diagrams</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Render Mermaid blocks in AsciiDoc via the diagram extension pipeline.
      </p>
      <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
        Open playground →
      </Link>
    </main>
  );
}
