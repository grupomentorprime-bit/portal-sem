"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploaderProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  previewClassName?: string;
}

export function ImageUploader({
  label,
  description,
  value,
  onChange,
  previewClassName,
}: ImageUploaderProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 block">{label}</Label>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={`flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 sm:w-40 ${previewClassName ?? ""}`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-zinc-400">Sin imagen</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
          />
          <p className="text-xs text-zinc-400">
            Ingresa la URL de la imagen. La carga directa de archivos se habilitará en una fase posterior.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LogoUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ImageUploader
      label="Logo institucional"
      description="Logo principal del portal. Se recomienda formato PNG con fondo transparente."
      value={value}
      onChange={onChange}
    />
  );
}

export function FaviconUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ImageUploader
      label="Favicon"
      description="Ícono del sitio mostrado en la pestaña del navegador."
      value={value}
      onChange={onChange}
      previewClassName="h-20 w-20"
    />
  );
}

export function HeroUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ImageUploader
      label="Imagen hero principal"
      description="Imagen destacada para la portada y metadatos Open Graph."
      value={value}
      onChange={onChange}
      previewClassName="h-32"
    />
  );
}
