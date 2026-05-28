import Link from "next/link";

export default function AsciiDocToPdfPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">AsciiDoc to PDF online</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Compile AsciiDoc to PDF with Asciidoctor-PDF in the browser playground.
      </p>
      <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
        Open playground →
      </Link>
    </main>
  );
}
