import { spawnSync } from "node:child_process";

const TOOL_COMMANDS: Record<string, string[]> = {
  jruby: ["jruby", "--version"],
  asciidoctor: [process.env.ASCIIDOCTOR_BIN ?? "asciidoctor", "--version"],
  "asciidoctor-pdf": [
    process.env.ASCIIDOCTOR_PDF_BIN ?? "asciidoctor-pdf",
    "--version",
  ],
  "asciidoctor-epub3": [
    process.env.ASCIIDOCTOR_EPUB_BIN ?? "asciidoctor-epub3",
    "--version",
  ],
  graphviz: [process.env.GRAPHVIZ_BIN ?? "dot", "-V"],
  mermaid: [process.env.MERMAID_BIN ?? "mmdc", "--version"],
  blockdiag: [process.env.BLOCKDIAG_BIN ?? "blockdiag", "--version"],
};

function readVersion(command: string[]): string {
  const [bin, ...args] = command;
  const result = spawnSync(bin, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.error) {
    return `missing (${result.error.message})`;
  }

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  if (!output) {
    return `exit ${result.status ?? 1}`;
  }

  return output.split(/\r?\n/)[0];
}

let cachedVersions: Record<string, string> | null = null;

export function getToolVersions(): Record<string, string> {
  if (cachedVersions) {
    return cachedVersions;
  }

  cachedVersions = Object.fromEntries(
    Object.entries(TOOL_COMMANDS).map(([name, command]) => [
      name,
      readVersion(command),
    ]),
  );
  return cachedVersions;
}
