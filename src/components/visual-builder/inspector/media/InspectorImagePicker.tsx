"use client";

import { MediaField } from "@/components/media/MediaPicker";
import type { MediaFolder } from "@/types/media";
import type { MediaPickerContext } from "@/components/media/MediaManager";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorImagePickerProps extends InspectorFieldBaseProps {
  value: string;
  onChange: (mediaId: string) => void;
  tenant: string;
  folder?: MediaFolder;
  category?: string;
  pickerContext?: MediaPickerContext;
  changeLabel?: string;
}

/**
 * Selector de imagen vía Biblioteca Institucional (nunca input file nativo).
 * @example
 * <InspectorImagePicker tenant={tenant} label="Imagen de fondo" value={id} onChange={setId} />
 */
export function InspectorImagePicker({
  label = "Imagen",
  hint = "Elija una imagen de la biblioteca institucional.",
  value,
  onChange,
  tenant,
  folder,
  category = "Imagen",
  pickerContext,
  changeLabel = "Elegir de la biblioteca",
  disabled,
}: InspectorImagePickerProps) {
  if (disabled) {
    return (
      <div className="opacity-60">
        <MediaField
          label={label}
          description={hint}
          value={value}
          onChange={() => {}}
          tenant={tenant}
          folder={folder}
          category={category}
          pickerContext={pickerContext}
          changeLabel={changeLabel}
        />
      </div>
    );
  }

  return (
    <MediaField
      label={label}
      description={hint}
      value={value}
      onChange={onChange}
      tenant={tenant}
      folder={folder}
      category={category}
      pickerContext={pickerContext}
      changeLabel={changeLabel}
    />
  );
}
