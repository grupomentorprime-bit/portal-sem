"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#003B73"
          className="font-mono"
        />
      </div>
    </div>
  );
}
