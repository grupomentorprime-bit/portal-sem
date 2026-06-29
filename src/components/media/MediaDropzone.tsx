"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";

interface MediaDropzoneProps {
  tenant: string;
  folder?: string;
  onUploaded: () => void;
}

export function MediaDropzone({ tenant, folder, onUploaded }: MediaDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      setError(null);
      try {
        for (const file of Array.from(files)) {
          const form = new FormData();
          form.append("file", file);
          form.append("tenant", tenant);
          if (folder) form.append("folder", folder);
          const res = await fetch("/api/cms/media", { method: "POST", body: form });
          const data = await res.json();
          if (!data.ok) {
            setError(data.error ?? data.errors?.[0]?.message ?? "Error al subir.");
            break;
          }
        }
        onUploaded();
      } catch {
        setError("Error de red al subir.");
      } finally {
        setUploading(false);
      }
    },
    [tenant, folder, onUploaded]
  );

  return (
    <div
      className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
      }}
    >
      <Upload className="mx-auto h-8 w-8 text-muted" strokeWidth={1.5} />
      <p className="mt-2 text-sm text-muted">Arrastra archivos o selecciona para subir</p>
      <p className="mt-1 text-xs text-muted">PNG, JPG, WEBP, SVG, PDF, MP4, MP3, ZIP</p>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        <label className="mt-4 inline-block cursor-pointer">
          <input
            type="file"
            multiple
            className="hidden"
            accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.mp4,.mp3,.zip"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
          <span className="inline-flex h-8 items-center rounded-md bg-secondary px-3 text-xs font-medium text-white">
            {uploading ? "Subiendo…" : "Seleccionar archivos"}
          </span>
        </label>
    </div>
  );
}

/** Alias OT */
export const MediaUploader = MediaDropzone;
