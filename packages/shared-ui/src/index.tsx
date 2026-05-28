import type { ReactNode } from "react";

export function AppHeader({
  title,
  githubUrl,
  children,
}: {
  title: string;
  githubUrl: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold">{title}</span>
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          GitHub
        </a>
      </div>
      {children}
    </header>
  );
}

export function FileDrop({
  label,
  accept,
  onFiles,
}: {
  label: string;
  accept?: string;
  onFiles: (files: FileList) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900">
      <span>{label}</span>
      <input
        type="file"
        className="hidden"
        accept={accept}
        multiple
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
        }}
      />
    </label>
  );
}
