"use client";

import { MediaField } from "@/components/media/MediaPicker";
import type { MediaFolder } from "@/types/media";

interface ImageUploaderProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  tenant: string;
  folder?: MediaFolder;
  category?: string;
  previewClassName?: string;
}

export function ImageUploader({
  label,
  description,
  value,
  onChange,
  tenant,
  folder,
  category,
  previewClassName,
}: ImageUploaderProps) {
  return (
    <MediaField
      label={label}
      description={description}
      value={value}
      onChange={onChange}
      tenant={tenant}
      folder={folder}
      category={category}
      previewClassName={previewClassName}
    />
  );
}

export function LogoUploader({
  value,
  onChange,
  tenant,
}: {
  value: string;
  onChange: (value: string) => void;
  tenant: string;
}) {
  return (
    <ImageUploader
      label="Logo institucional"
      description="Logo principal del portal. Se recomienda formato PNG con fondo transparente."
      value={value}
      onChange={onChange}
      tenant={tenant}
      folder="Logos"
      category="Imagen"
    />
  );
}

export function FaviconUploader({
  value,
  onChange,
  tenant,
}: {
  value: string;
  onChange: (value: string) => void;
  tenant: string;
}) {
  return (
    <ImageUploader
      label="Favicon"
      description="Ícono del sitio mostrado en la pestaña del navegador."
      value={value}
      onChange={onChange}
      tenant={tenant}
      folder="Iconos"
      category="Icono"
      previewClassName="h-20 w-20"
    />
  );
}

export function HeroUploader({
  value,
  onChange,
  tenant,
}: {
  value: string;
  onChange: (value: string) => void;
  tenant: string;
}) {
  return (
    <ImageUploader
      label="Imagen hero principal"
      description="Imagen destacada para la portada y metadatos Open Graph."
      value={value}
      onChange={onChange}
      tenant={tenant}
      folder="Hero"
      category="Imagen"
      previewClassName="h-32"
    />
  );
}
