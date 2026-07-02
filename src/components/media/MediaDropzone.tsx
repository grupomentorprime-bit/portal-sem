"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CmsMediaAsset } from "@/types/media";
import type { MediaOptimizationSummary } from "@/lib/cms/media-optimization";
import { getFolderHint } from "@/lib/cms/media-folder-hints";
import { HERO_UPLOAD_MAX_BYTES } from "@/lib/cms/media-hero";
import { MediaOptimizationInfo } from "./MediaOptimizationInfo";

export interface MediaDropzoneHandle {
  openFileDialog: () => void;
}

export type MediaDropzoneVariant = "default" | "compact" | "hero-empty" | "toolbar";
export type UploadPhase = "idle" | "uploading" | "processing" | "optimizing" | "done" | "error";

interface UploadResult {
  media: CmsMediaAsset;
  optimization?: MediaOptimizationSummary | null;
}

interface MediaDropzoneProps {
  tenant: string;
  folder?: string;
  onUploaded: () => void;
  onUploadComplete?: (result: UploadResult) => void;
  variant?: MediaDropzoneVariant;
  heroMode?: boolean;
  buttonLabel?: string;
}

export const MediaDropzone = forwardRef<MediaDropzoneHandle, MediaDropzoneProps>(
  function MediaDropzone(
    {
      tenant,
      folder,
      onUploaded,
      onUploadComplete,
      variant = "default",
      heroMode,
      buttonLabel = "Seleccionar archivos",
    },
    ref
  ) {
    const [phase, setPhase] = useState<UploadPhase>("idle");
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [lastOptimization, setLastOptimization] = useState<MediaOptimizationSummary | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isHero = heroMode || folder === "Hero";
    const accept = isHero
      ? ".png,.jpg,.jpeg,.webp"
      : ".png,.jpg,.jpeg,.webp,.svg,.pdf,.mp4,.mp3,.zip";
    const acceptHint = isHero ? "JPG · PNG · WEBP" : "PNG, JPG, WEBP, SVG, PDF, MP4, MP3, ZIP";
    const uploading = phase !== "idle" && phase !== "done" && phase !== "error";

    useImperativeHandle(ref, () => ({
      openFileDialog: () => inputRef.current?.click(),
    }));

    const phaseLabel = {
      idle: "",
      uploading: "Subiendo…",
      processing: "Procesando…",
      optimizing: "Optimizando…",
      done: "Listo",
      error: "Error al subir",
    }[phase];

    const uploadFiles = useCallback(
      async (files: FileList | File[]) => {
        if (!tenant?.trim()) {
          setError("Configure el tenant institucional antes de subir archivos.");
          setPhase("error");
          return;
        }

        setPhase("uploading");
        setError(null);
        setWarnings([]);
        setLastOptimization(null);
        const newWarnings: string[] = [];

        try {
          const fileList = Array.from(files);
          let failed = false;

          for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i]!;
            if (isHero && file.size > HERO_UPLOAD_MAX_BYTES) {
              newWarnings.push(`"${file.name}" supera 1 MB. Se subió igualmente.`);
            }

            setPhase(i === 0 ? "uploading" : "processing");
            const form = new FormData();
            form.append("file", file);
            form.append("tenant", tenant);
            form.append("folder", folder ?? "Hero");
            if (isHero) form.append("tags", "Hero");

            setPhase("optimizing");
            const res = await fetch("/api/cms/media", { method: "POST", body: form });
            const data = await res.json();

            if (!data.ok) {
              const msg =
                data.error ??
                data.errors?.[0]?.message ??
                (data.errors?.[0]?.field === "mimeType"
                  ? "Formato no permitido"
                  : data.errors?.[0]?.field === "size"
                    ? "Archivo muy pesado"
                    : "Error al subir");
              setError(msg);
              setPhase("error");
              failed = true;
              break;
            }

            if (data.optimization) setLastOptimization(data.optimization);
            onUploadComplete?.({ media: data.media, optimization: data.optimization });
          }

          if (newWarnings.length) setWarnings(newWarnings);
          if (!failed) {
            setPhase("done");
            onUploaded();
            setTimeout(() => setPhase("idle"), 2500);
          }
        } catch {
          setError("Error de red al subir.");
          setPhase("error");
        } finally {
          setDragOver(false);
        }
      },
      [tenant, folder, isHero, onUploaded, onUploadComplete]
    );

    const hiddenInput = (
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept={accept}
        aria-hidden
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
    );

    const dropHandlers = {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
      },
      onDragLeave: () => setDragOver(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) void uploadFiles(e.dataTransfer.files);
      },
    };

    const feedback = (
      <>
        {phase !== "idle" && phase !== "done" ? (
          <p className="mt-2 flex items-center justify-center gap-2 text-xs text-secondary" role="status">
            <Loader2 size={14} className="animate-spin" aria-hidden />
            {phaseLabel}
          </p>
        ) : null}
        {phase === "done" ? (
          <p className="mt-2 flex items-center justify-center gap-2 text-xs font-medium text-success" role="status">
            <CheckCircle2 size={14} aria-hidden />
            Listo — disponible inmediatamente
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-xs text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        {warnings.map((w) => (
          <p key={w} className="mt-1 text-xs text-[var(--color-warning)]" role="status">
            {w}
          </p>
        ))}
        {lastOptimization && phase === "done" ? (
          <div className="mx-auto mt-3 max-w-sm text-left">
            <MediaOptimizationInfo summary={lastOptimization} />
          </div>
        ) : null}
      </>
    );

    if (variant === "toolbar") {
      return (
        <div className="inline-flex">
          {hiddenInput}
          <Button
            type="button"
            size="sm"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
            aria-label="Subir archivos"
          >
            <Upload size={16} className="mr-1.5" aria-hidden />
            Subir
          </Button>
        </div>
      );
    }

    if (variant === "compact") {
      return (
        <div
          className={`media-dropzone media-dropzone--compact flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors ${
            dragOver ? "border-secondary bg-secondary/5" : "border-border bg-muted/10"
          }`}
          {...dropHandlers}
        >
          {hiddenInput}
          <div className="text-sm text-muted">
            <span className="font-medium text-foreground">Arrastre archivos aquí</span>
            <span className="mx-1">·</span>
            <span>o</span>
            <button
              type="button"
              className="ml-1 font-medium text-secondary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
              onClick={() => inputRef.current?.click()}
            >
              seleccionar archivos
            </button>
            <span className="ml-1 text-xs">({folder ?? "Hero"})</span>
          </div>
          <Button
            type="button"
            size="sm"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={16} className="mr-1.5" aria-hidden />
            {uploading ? phaseLabel : buttonLabel}
          </Button>
          {feedback}
        </div>
      );
    }

    if (variant === "hero-empty") {
      const hint = getFolderHint("Hero");
      return (
        <div
          className={`media-dropzone media-dropzone--hero rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver ? "border-secondary bg-secondary/5" : "border-border bg-muted/20"
          }`}
          {...dropHandlers}
          role="region"
          aria-label="Zona de carga Hero"
        >
          {hiddenInput}
          <Upload className="mx-auto h-12 w-12 text-muted" strokeWidth={1.5} aria-hidden />
          <p className="mt-4 text-lg font-semibold text-foreground">{hint.title}</p>
          <p className="mt-3 text-sm font-medium text-foreground">Arrastre archivos aquí</p>
          <p className="text-sm text-muted">o</p>
          <ul className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-muted">
            <li className="text-center font-medium text-foreground">Recomendaciones:</li>
            {hint.recommendations.map((line) => (
              <li key={line} className="list-inside list-disc">
                {line}
              </li>
            ))}
          </ul>
          <Button
            type="button"
            className="mt-6 min-h-11"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={18} className="mr-2" aria-hidden />
            {uploading ? phaseLabel : "Subir imágenes"}
          </Button>
          {feedback}
        </div>
      );
    }

    return (
      <div
        className={`media-dropzone rounded-lg border border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-secondary bg-secondary/5" : "border-border bg-muted/20"
        }`}
        {...dropHandlers}
        role="region"
        aria-label="Zona de carga de archivos"
      >
        {hiddenInput}
        <Upload className="mx-auto h-8 w-8 text-muted" strokeWidth={1.5} aria-hidden />
        <p className="mt-2 text-sm font-medium text-foreground">Arrastre archivos aquí</p>
        <p className="mt-1 text-xs text-muted">o</p>
        <Button
          type="button"
          className="mt-3 min-h-10"
          size="sm"
          variant="secondary"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? phaseLabel : "Seleccionar archivos"}
        </Button>
        <p className="mt-2 text-[11px] text-muted">{acceptHint}</p>
        {feedback}
      </div>
    );
  }
);

export const MediaUploader = MediaDropzone;
