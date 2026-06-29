"use client";

import { MEDIA_FOLDERS } from "@/types/media";

interface MediaFolderTreeProps {
  activeFolder?: string;
  onSelect: (folder?: string) => void;
}

export function MediaFolderTree({ activeFolder, onSelect }: MediaFolderTreeProps) {
  return (
    <nav className="space-y-1">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
          !activeFolder ? "bg-secondary/10 font-medium text-secondary" : "text-muted hover:bg-muted/40"
        }`}
      >
        Todas las carpetas
      </button>
      {MEDIA_FOLDERS.map((folder) => (
        <button
          key={folder}
          type="button"
          onClick={() => onSelect(folder)}
          className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
            activeFolder === folder
              ? "bg-secondary/10 font-medium text-secondary"
              : "text-muted hover:bg-muted/40"
          }`}
        >
          {folder}
        </button>
      ))}
    </nav>
  );
}

/** Alias OT */
export const MediaSidebar = MediaFolderTree;
