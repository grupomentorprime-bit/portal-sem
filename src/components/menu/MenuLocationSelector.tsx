"use client";

import { MENU_LOCATIONS } from "@/types/menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MenuLocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MenuLocationSelector({ value, onChange }: MenuLocationSelectorProps) {
  return (
    <div>
      <Label className="mb-2 block">Ubicación</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {MENU_LOCATIONS.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-zinc-400">
        O ingresa una ubicación personalizada:
      </p>
      <Input
        className="mt-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="custom-location"
      />
    </div>
  );
}
