"use client";

import { colorDefaults } from "@/design/tokens/colors";
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
          className="h-10 w-12 cursor-pointer rounded border border-border bg-background p-1 dark:border-gray-700 dark:bg-gray-900"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={colorDefaults.primary}
          className="font-mono"
        />
      </div>
    </div>
  );
}
