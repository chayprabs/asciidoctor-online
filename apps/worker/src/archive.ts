import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AsciidocProject, ProjectFile } from "@asciidoc-cloud/shared-types";
import { ZipFile } from "yazl";

function fileToBuffer(file: ProjectFile): Buffer {
  return file.encoding === "base64"
    ? Buffer.from(file.content, "base64")
    : Buffer.from(file.content, "utf8");
}

export async function writeProjectArchive(
  project: AsciidocProject,
  artifactsRoot: string,
  jobId: string,
): Promise<{ filename: string; path: string; url: string }> {
  const filename = `${jobId}-project.zip`;
  const archivePath = join(artifactsRoot, jobId, filename);
  await mkdir(dirname(archivePath), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const zip = new ZipFile();
    const output = createWriteStream(archivePath);

    output.on("close", () => resolve());
    output.on("error", reject);
    zip.outputStream.on("error", reject);

    for (const file of project.files) {
      zip.addBuffer(fileToBuffer(file), file.path);
    }

    if (project.theme) {
      const ext = project.theme.format === "yaml" ? "yml" : "css";
      zip.addBuffer(
        Buffer.from(project.theme.content, "utf8"),
        `.themes/custom.${ext}`,
      );
    }

    zip.addBuffer(
      Buffer.from(JSON.stringify(project.attributes, null, 2), "utf8"),
      "project.attributes.json",
    );

    zip.end();
    zip.outputStream.pipe(output);
  });

  return {
    filename,
    path: archivePath,
    url: `/v1/artifacts/${jobId}/${filename}`,
  };
}
