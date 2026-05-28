import { create } from "zustand";
import {
  COMMON_ATTRIBUTE_KEYS,
  THEME_GALLERY,
  type AsciidocProject,
  type CompileResult,
  type ProjectFile,
  type ThemeGalleryItem,
} from "@asciidoc-cloud/shared-types";

const DEFAULT_DOC = `= Hello AsciidocCloud
:toc:

This is a sample AsciiDoc document.

== Section

* item one
* item two

[source,ruby]
----
puts "hello"
----
`;

const DEFAULT_THEME = THEME_GALLERY[0];
const TEXT_LIKE_EXTENSIONS = /\.(adoc|asciidoc|txt|md|css|ya?ml|json|xml|svg|puml|mmd|dot|diag)$/i;

function sortFiles(files: ProjectFile[]): ProjectFile[] {
  return [...files].sort((left, right) => left.path.localeCompare(right.path));
}

export function isEditableFile(file: ProjectFile | undefined): boolean {
  if (!file) {
    return false;
  }
  if (file.encoding === "base64") {
    return false;
  }
  return TEXT_LIKE_EXTENSIONS.test(file.path);
}

export function parseCustomAttributes(input: string): Record<string, string> {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((attributes, line) => {
      const separator = line.includes("=") ? "=" : ":";
      const [rawKey, ...rawValue] = line.split(separator);
      const key = rawKey?.trim();
      if (!key) {
        return attributes;
      }
      attributes[key] = rawValue.join(separator).trim();
      return attributes;
    }, {});
}

export function serializeCustomAttributes(
  attributes: Record<string, string>,
): string {
  return Object.entries(attributes)
    .filter(([key]) => !COMMON_ATTRIBUTE_KEYS.includes(key as (typeof COMMON_ATTRIBUTE_KEYS)[number]))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function parseRemoteIncludeAllowlist(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\r\n,]+/)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function serializeRemoteIncludeAllowlist(hosts: string[] | undefined): string {
  return (hosts ?? []).join("\n");
}

function upsertFile(files: ProjectFile[], nextFile: ProjectFile): ProjectFile[] {
  const match = files.find((file) => file.path === nextFile.path);
  if (match) {
    return sortFiles(
      files.map((file) => (file.path === nextFile.path ? { ...file, ...nextFile } : file)),
    );
  }
  return sortFiles([...files, nextFile]);
}

export function renameProjectFile(
  files: ProjectFile[],
  fromPath: string,
  toPath: string,
): ProjectFile[] {
  const normalized = toPath.trim();
  if (!normalized || normalized === fromPath) {
    return files;
  }
  return sortFiles(
    files.map((file) =>
      file.path === fromPath ? { ...file, path: normalized } : file,
    ),
  );
}

interface PlaygroundState {
  project: AsciidocProject;
  activePath: string;
  entryPath: string;
  compileResult: CompileResult | null;
  compiling: boolean;
  error: string | null;
  selectedThemeId: string | null;
  setActivePath: (path: string) => void;
  setEntryPath: (path: string) => void;
  updateFile: (path: string, content: string) => void;
  addFile: (path: string) => void;
  uploadFile: (file: ProjectFile) => void;
  renameFile: (fromPath: string, toPath: string) => void;
  removeFile: (path: string) => void;
  setAttribute: (key: string, value: string) => void;
  setCustomAttributes: (input: string) => void;
  setRemoteIncludeAllowlist: (input: string) => void;
  setTheme: (format: "yaml" | "css", content: string) => void;
  setThemePreset: (theme: ThemeGalleryItem | null) => void;
  setCompileResult: (result: CompileResult | null) => void;
  setCompiling: (v: boolean) => void;
  setError: (msg: string | null) => void;
}

export const usePlayground = create<PlaygroundState>((set, get) => ({
  project: {
    files: [{ path: "index.adoc", content: DEFAULT_DOC }],
    attributes: { author: "You", revdate: new Date().toISOString().slice(0, 10) },
    theme: { format: DEFAULT_THEME.format, content: DEFAULT_THEME.content },
    remoteIncludeAllowlist: [],
  },
  activePath: "index.adoc",
  entryPath: "index.adoc",
  compileResult: null,
  compiling: false,
  error: null,
  selectedThemeId: DEFAULT_THEME.id,
  setActivePath: (path) => set({ activePath: path }),
  setEntryPath: (path) => set({ entryPath: path }),
  updateFile: (path, content) =>
    set({
      project: {
        ...get().project,
        files: get().project.files.map((file) =>
          file.path === path ? { ...file, content, encoding: "utf8" } : file,
        ),
      },
    }),
  addFile: (path) =>
    set({
      project: {
        ...get().project,
        files: upsertFile(get().project.files, {
          path,
          content: "",
          encoding: "utf8",
        }),
      },
      activePath: path,
    }),
  uploadFile: (file) =>
    set({
      project: {
        ...get().project,
        files: upsertFile(get().project.files, file),
      },
      activePath: file.path,
    }),
  renameFile: (fromPath, toPath) => {
    const files = renameProjectFile(get().project.files, fromPath, toPath);
    const normalized = toPath.trim();
    set({
      project: { ...get().project, files },
      activePath: get().activePath === fromPath ? normalized : get().activePath,
      entryPath: get().entryPath === fromPath ? normalized : get().entryPath,
    });
  },
  removeFile: (path) => {
    const files = get().project.files.filter((f) => f.path !== path);
    set({
      project: { ...get().project, files },
      activePath: files[0]?.path ?? "",
      entryPath: get().entryPath === path ? files[0]?.path ?? "" : get().entryPath,
    });
  },
  setAttribute: (key, value) =>
    set({
      project: {
        ...get().project,
        attributes: { ...get().project.attributes, [key]: value },
      },
    }),
  setCustomAttributes: (input) =>
    set({
      project: {
        ...get().project,
        attributes: {
          ...Object.fromEntries(
            Object.entries(get().project.attributes).filter(([key]) =>
              COMMON_ATTRIBUTE_KEYS.includes(
                key as (typeof COMMON_ATTRIBUTE_KEYS)[number],
              ),
            ),
          ),
          ...parseCustomAttributes(input),
        },
      },
    }),
  setRemoteIncludeAllowlist: (input) =>
    set({
      project: {
        ...get().project,
        remoteIncludeAllowlist: parseRemoteIncludeAllowlist(input),
      },
    }),
  setTheme: (format, content) =>
    set({
      project: {
        ...get().project,
        theme: { format, content },
      },
      selectedThemeId: null,
    }),
  setThemePreset: (theme) =>
    set({
      project: {
        ...get().project,
        theme: theme ? { format: theme.format, content: theme.content } : undefined,
      },
      selectedThemeId: theme?.id ?? null,
    }),
  setCompileResult: (compileResult) => set({ compileResult }),
  setCompiling: (compiling) => set({ compiling }),
  setError: (error) => set({ error }),
}));
