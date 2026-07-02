"use client";

import { MediaField } from "@/components/media/MediaPicker";
import type { MediaFolder } from "@/types/media";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorVideoPickerProps extends InspectorFieldBaseProps {
  value: string;
  onChange: (mediaId: string) => void;
  tenant: string;
  folder?: MediaFolder;
}

/**
 * Video desde Biblioteca Institucional (categoría Video).
 */
export function InspectorVideoPicker({
  label = "Video",
  hint = "Seleccione un video de la biblioteca. No use enlaces externos.",
  value,
  onChange,
  tenant,
  folder,
  disabled,
}: InspectorVideoPickerProps) {
  return (
    <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
      <MediaField
        label={label}
        description={hint}
        value={value}
        onChange={onChange}
        tenant={tenant}
        folder={folder ?? "Videos"}
        category="Video"
        changeLabel={value ? "Cambiar video" : "Elegir de la biblioteca"}
      />
    </div>
  );
}
