"use client";

import { useRef } from "react";
import { FileCheck2, FileUp, Loader2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ABSENCE_REVIEW_POLICY } from "@/lib/admin/forms-center";
import type { FormSubmissionAttachment } from "@/lib/experience/forms/attachments";

interface AbsenceJustificationFieldsProps {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  disabled?: boolean;
  uploading?: boolean;
  onChange: (name: string, value: unknown) => void;
  onFileChange?: (file: File | undefined) => void | Promise<void>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AbsenceJustificationFields({
  values,
  errors,
  disabled,
  uploading = false,
  onChange,
  onFileChange,
}: AbsenceJustificationFieldsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachment = values.justificationAttachment as FormSubmissionAttachment | undefined;
  const pendingFile = values.justificationAttachmentFile as File | undefined;
  const selectedName = pendingFile?.name ?? attachment?.filename ?? "";
  const selectedSize = pendingFile?.size ?? attachment?.size ?? 0;
  const hasSelectedFile = Boolean(selectedName);
  const isUploaded = Boolean(attachment?.mediaId);

  const handleClearFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onFileChange) {
      void onFileChange(undefined);
      return;
    }
    onChange("justificationAttachmentFile", undefined);
    onChange("justificationAttachment", undefined);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (onFileChange) {
      void onFileChange(file);
      return;
    }
    onChange("justificationAttachmentFile", file ?? undefined);
    onChange("justificationAttachment", undefined);
  };

  if (values.attendance !== "no") return null;

  return (
    <div className="space-y-4 rounded-xl border border-warning/30 bg-warning/5 p-4">
      <div>
        <p className="font-medium text-foreground">Justificación de inasistencia</p>
        <p className="mt-1 text-sm text-muted">{ABSENCE_REVIEW_POLICY}</p>
      </div>

      <Textarea
        label="Motivo de inasistencia"
        name="justification"
        rows={4}
        helper="Explica brevemente la situación de fuerza mayor (mínimo 10 caracteres)."
        error={errors.justification}
        required
        disabled={disabled}
        value={String(values.justification ?? "")}
        onChange={(event) => onChange("justification", event.target.value)}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Adjuntar justificativo <span className="text-primary">*</span>
        </p>
        <p className="text-xs text-muted">PDF o imagen (JPG, PNG, WEBP). Máximo 5 MB.</p>

        <input
          ref={fileInputRef}
          id="justificationAttachmentFile"
          name="justificationAttachmentFile"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={handleFileInputChange}
        />

        {hasSelectedFile ? (
          <div className="absence-attachment-card" role="status" aria-live="polite">
            <div className="absence-attachment-card__icon" aria-hidden="true">
              {uploading ? <Loader2 className="animate-spin" /> : <FileCheck2 />}
            </div>
            <div className="absence-attachment-card__body">
              <p className="absence-attachment-card__eyebrow">
                {uploading ? "Subiendo documento…" : isUploaded ? "Documento listo" : "Documento adjunto"}
              </p>
              <p className="absence-attachment-card__filename">{selectedName}</p>
              {selectedSize > 0 ? (
                <p className="absence-attachment-card__meta">{formatFileSize(selectedSize)}</p>
              ) : null}
            </div>
            <div className="absence-attachment-card__actions">
              <button
                type="button"
                className="absence-attachment-card__change"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
              >
                <FileUp className="h-4 w-4" aria-hidden="true" />
                Cambiar
              </button>
              <button
                type="button"
                className="absence-attachment-card__remove"
                onClick={handleClearFile}
                disabled={disabled || uploading}
                aria-label="Quitar archivo adjunto"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="absence-attachment-upload"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <FileUp className="h-5 w-5" aria-hidden="true" />
            )}
            <span>{uploading ? "Subiendo…" : "Seleccionar archivo"}</span>
          </button>
        )}

        {errors.justificationAttachment ? (
          <p className="text-xs text-primary" role="alert">
            {errors.justificationAttachment}
          </p>
        ) : null}
      </div>
    </div>
  );
}
