"use client";

import { AppHeader, FileDrop } from "@asciidoc-cloud/shared-ui";
import {
  COMMON_ATTRIBUTE_KEYS,
  THEME_GALLERY,
  type CompileFormat,
  type ProjectFile,
} from "@asciidoc-cloud/shared-types";
import { useEffect, useMemo, useState } from "react";
import { compileProject } from "@/lib/compile-client";
import {
  isEditableFile,
  serializeRemoteIncludeAllowlist,
  serializeCustomAttributes,
  usePlayground,
} from "@/lib/store";
import { SAMPLE_PROJECTS } from "@/lib/samples";

const FORMATS: CompileFormat[] = ["html5", "pdf", "epub", "docbook"];
const TEXT_UPLOAD_EXTENSIONS =
  /\.(adoc|asciidoc|txt|md|css|ya?ml|json|xml|svg|puml|mmd|dot|diag)$/i;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timeout);
  }, [value, ms]);

  return debounced;
}

function looksTextLike(file: File): boolean {
  return file.type.startsWith("text/") || TEXT_UPLOAD_EXTENSIONS.test(file.name);
}

async function fileToProjectFile(file: File): Promise<ProjectFile> {
  if (looksTextLike(file)) {
    return {
      path: `assets/${file.name}`,
      content: await file.text(),
      encoding: "utf8",
      mediaType: file.type || "text/plain",
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return {
    path: `assets/${file.name}`,
    content: btoa(binary),
    encoding: "base64",
    mediaType: file.type || "application/octet-stream",
  };
}

function OutputLink({
  format,
  url,
}: {
  format: CompileFormat;
  url?: string;
}) {
  return (
    <a
      href={url ? `/api/worker${url}` : "#"}
      className={`px-3 py-2 text-sm ${url ? "hover:bg-gray-100 dark:hover:bg-gray-800" : "pointer-events-none opacity-50"}`}
      target="_blank"
      rel="noreferrer"
    >
      {format}
    </a>
  );
}

export function Playground() {
  const {
    project,
    activePath,
    entryPath,
    compileResult,
    compiling,
    error,
    selectedThemeId,
    setActivePath,
    setEntryPath,
    loadSample,
    updateFile,
    addFile,
    uploadFile,
    renameFile,
    removeFile,
    setAttribute,
    setCustomAttributes,
    setRemoteIncludeAllowlist,
    setTheme,
    setThemePreset,
    setCompileResult,
    setCompiling,
    setError,
  } = usePlayground();

  const activeFile = useMemo(
    () => project.files.find((file) => file.path === activePath),
    [activePath, project.files],
  );
  const debouncedProject = useDebounced(project, 800);
  const debouncedEntryPath = useDebounced(entryPath, 800);
  const [pathDraft, setPathDraft] = useState(activePath);
  const [customAttributeDraft, setCustomAttributeDraft] = useState(
    serializeCustomAttributes(project.attributes),
  );
  const [remoteAllowlistDraft, setRemoteAllowlistDraft] = useState(
    serializeRemoteIncludeAllowlist(project.remoteIncludeAllowlist),
  );
  const diagnostics = compileResult
    ? [
        ...compileResult.warnings.map((warning) => `warning: ${warning}`),
        ...compileResult.missingAssets.map((missing) => `missing: ${missing}`),
      ]
    : [];

  useEffect(() => {
    setPathDraft(activePath);
  }, [activePath]);

  useEffect(() => {
    setCustomAttributeDraft(serializeCustomAttributes(project.attributes));
  }, [project.attributes]);

  useEffect(() => {
    setRemoteAllowlistDraft(
      serializeRemoteIncludeAllowlist(project.remoteIncludeAllowlist),
    );
  }, [project.remoteIncludeAllowlist]);

  useEffect(() => {
    let cancelled = false;

    async function runPreviewCompile() {
      setCompiling(true);
      setError(null);

      try {
        const result = await compileProject(debouncedProject, ["html5"], debouncedEntryPath);
        if (!cancelled) {
          setCompileResult(result);
        }
      } catch (compileError) {
        if (!cancelled) {
          setError(
            compileError instanceof Error ? compileError.message : "Compile failed",
          );
        }
      } finally {
        if (!cancelled) {
          setCompiling(false);
        }
      }
    }

    void runPreviewCompile();

    return () => {
      cancelled = true;
    };
  }, [
    debouncedEntryPath,
    debouncedProject,
    setCompileResult,
    setCompiling,
    setError,
  ]);

  async function runCompile(targets: CompileFormat[] = ["html5"]) {
    setCompiling(true);
    setError(null);

    try {
      const result = await compileProject(project, targets, entryPath);
      setCompileResult(result);
    } catch (compileError) {
      setError(compileError instanceof Error ? compileError.message : "Compile failed");
    } finally {
      setCompiling(false);
    }
  }

  async function handleAssetUpload(files: FileList) {
    for (const file of Array.from(files)) {
      if (file.name.endsWith(".yml") || file.name.endsWith(".yaml")) {
        setTheme("yaml", await file.text());
        continue;
      }
      if (file.name.endsWith(".css")) {
        setTheme("css", await file.text());
        continue;
      }
      uploadFile(await fileToProjectFile(file));
    }
  }

  const commonAttributes = COMMON_ATTRIBUTE_KEYS.map((key) => ({
    key,
    value: project.attributes[key] ?? "",
  }));

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 text-stone-900">
      <AppHeader
        title="AsciidocCloud"
        githubUrl="https://github.com/chayprabs/asciidoctor-online"
      >
        <button
          type="button"
          className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          disabled={compiling}
          onClick={() => void runCompile(FORMATS)}
        >
          {compiling ? "Compiling..." : "Compile all"}
        </button>
      </AppHeader>

      <main className="grid flex-1 grid-cols-1 lg:grid-cols-[320px_1fr_1fr]">
        <aside className="border-r border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                Project
              </h2>
              <p className="text-xs text-stone-500">
                Multi-file tree, uploads, attributes, and themes.
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:border-teal-700 hover:text-teal-700"
              onClick={() => addFile(`chapter-${project.files.length + 1}.adoc`)}
            >
              Add file
            </button>
          </div>

          <ul className="mt-4 space-y-2">
            {project.files.map((file) => (
              <li key={file.path} className="rounded-2xl border border-stone-200 bg-white p-2">
                <button
                  type="button"
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1 text-left text-sm ${
                    file.path === activePath ? "bg-teal-50 text-teal-900" : "hover:bg-stone-100"
                  }`}
                  onClick={() => setActivePath(file.path)}
                >
                  <span className="truncate">{file.path}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-stone-400">
                    {file.path === entryPath ? "entry" : file.encoding === "base64" ? "asset" : "text"}
                  </span>
                </button>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className={`rounded-full px-2 py-1 text-[11px] ${
                      file.path === entryPath
                        ? "bg-teal-700 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                    onClick={() => setEntryPath(file.path)}
                  >
                    Set entry
                  </button>
                  {project.files.length > 1 ? (
                    <button
                      type="button"
                      className="rounded-full bg-rose-50 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-100"
                      onClick={() => removeFile(file.path)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-3 rounded-3xl border border-stone-200 bg-white p-4">
            <div>
              <h3 className="text-sm font-semibold">Samples</h3>
              <div className="mt-3 space-y-2">
                {SAMPLE_PROJECTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    className="block w-full rounded-2xl border border-stone-200 p-3 text-left hover:border-stone-300"
                    onClick={() => loadSample(sample)}
                  >
                    <div className="font-medium">{sample.name}</div>
                    <p className="mt-1 text-xs text-stone-500">{sample.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <FileDrop
              label="Upload assets, fonts, and attribute files"
              onFiles={(files) => {
                void handleAssetUpload(files);
              }}
            />
            <FileDrop
              label="Upload a YAML or CSS theme"
              accept=".yml,.yaml,.css"
              onFiles={(files) => {
                void handleAssetUpload(files);
              }}
            />
          </div>

          <div className="mt-4 rounded-3xl border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Theme gallery</h3>
              <button
                type="button"
                className="text-xs text-stone-500 hover:text-stone-900"
                onClick={() => setThemePreset(null)}
              >
                Clear
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {THEME_GALLERY.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  className={`block w-full rounded-2xl border p-3 text-left ${
                    selectedThemeId === theme.id
                      ? "border-teal-700 bg-teal-50"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                  onClick={() => setThemePreset(theme)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{theme.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                      {theme.format}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{theme.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-semibold">Attributes</h3>
            <div className="mt-3 space-y-3">
              {commonAttributes.map(({ key, value }) => (
                <label key={key} className="block text-xs font-medium text-stone-600">
                  {key}
                  <input
                    className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-teal-700"
                    value={value}
                    onChange={(event) => setAttribute(key, event.target.value)}
                  />
                </label>
              ))}
            </div>
            <label className="mt-4 block text-xs font-medium text-stone-600">
              Custom attributes
              <textarea
                className="mt-1 min-h-32 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm text-stone-900 outline-none focus:border-teal-700"
                value={customAttributeDraft}
                onChange={(event) => setCustomAttributeDraft(event.target.value)}
                onBlur={() => setCustomAttributes(customAttributeDraft)}
                placeholder="icons=font&#10;sectanchors="
                spellCheck={false}
              />
            </label>
          </div>

          <div className="mt-4 rounded-3xl border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-semibold">Includes</h3>
            <p className="mt-1 text-xs text-stone-500">
              Local includes stay sandboxed in the project tree. Remote includes
              must use HTTPS and an allowlisted host.
            </p>
            <label className="mt-3 block text-xs font-medium text-stone-600">
              Remote include allowlist
              <textarea
                className="mt-1 min-h-24 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm text-stone-900 outline-none focus:border-teal-700"
                value={remoteAllowlistDraft}
                onChange={(event) => setRemoteAllowlistDraft(event.target.value)}
                onBlur={() => setRemoteIncludeAllowlist(remoteAllowlistDraft)}
                placeholder="docs.example.com&#10;cdn.example.com"
                spellCheck={false}
              />
            </label>
          </div>
        </aside>

        <section className="flex min-h-[50vh] flex-col border-r border-stone-200 bg-[#fffdf8]">
          <div className="border-b border-stone-200 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-stone-500">
                  Editor
                </div>
                <div className="text-sm text-stone-600">
                  Rename files and choose which `.adoc` entry compiles.
                </div>
              </div>
              <div className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
                Entry: {entryPath || "none"}
              </div>
            </div>
            <label className="mt-3 block text-xs font-medium text-stone-600">
              Path
              <input
                className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700"
                value={pathDraft}
                onChange={(event) => setPathDraft(event.target.value)}
                onBlur={() => renameFile(activePath, pathDraft)}
              />
            </label>
          </div>

          {isEditableFile(activeFile) ? (
            <textarea
              className="min-h-[60vh] flex-1 resize-none bg-transparent p-4 font-mono text-sm outline-none"
              value={activeFile?.content ?? ""}
              onChange={(event) => updateFile(activePath, event.target.value)}
              spellCheck={false}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-stone-500">
              <div>
                <p className="font-medium text-stone-700">{activeFile?.path}</p>
                <p className="mt-2">
                  Binary assets stay in the project tree and are written back to the
                  worker unchanged.
                </p>
              </div>
            </div>
          )}

          {error ? (
            <p className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </section>

        <section className="flex min-h-[50vh] flex-col bg-white">
          <div className="flex items-center justify-between border-b border-stone-200">
            <div className="flex">
              {FORMATS.map((format) => (
                <OutputLink
                  key={format}
                  format={format}
                  url={compileResult?.outputs.find((output) => output.format === format)?.url}
                />
              ))}
            </div>
            <a
              href={compileResult?.projectArchive?.url ? `/api/worker${compileResult.projectArchive.url}` : "#"}
              className={`px-3 py-2 text-sm ${
                compileResult?.projectArchive?.url
                  ? "text-teal-700 hover:bg-teal-50"
                  : "pointer-events-none opacity-50"
              }`}
              target="_blank"
              rel="noreferrer"
            >
              project.zip
            </a>
          </div>

          <iframe
            title="HTML preview"
            className="min-h-[60vh] flex-1 bg-white"
            srcDoc={compileResult?.previewHtml ?? "<p>Preview will appear after compile.</p>"}
            sandbox="allow-same-origin"
          />

          <div className="grid gap-4 border-t border-stone-200 bg-stone-50 p-4 lg:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-stone-500">
                Diagnostics
              </div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-2xl bg-stone-900 p-3 text-xs text-stone-100">
                {diagnostics.length ? diagnostics.join("\n") : "No warnings or missing assets."}
              </pre>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-stone-500">
                Active theme
              </div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-2xl bg-stone-900 p-3 text-xs text-stone-100">
                {project.theme
                  ? `${project.theme.format}\n\n${project.theme.content}`
                  : "No theme selected."}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
