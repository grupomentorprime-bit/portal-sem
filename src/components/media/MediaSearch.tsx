"use client";

import { Input } from "@/components/ui/input";

interface MediaSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MediaSearch({
  value,
  onChange,
  placeholder = "Buscar por nombre, etiqueta o alt…",
}: MediaSearchProps) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label="Buscar en biblioteca de medios"
    />
  );
}
