"use client";

import { Label } from "@/components/ui/label";
import { MENU_TARGETS, type MenuTarget } from "@/types/menu";

interface MenuTargetSelectorProps {
  value: MenuTarget;
  onChange: (value: MenuTarget) => void;
}

export function MenuTargetSelector({ value, onChange }: MenuTargetSelectorProps) {
  return (
    <div>
      <Label className="mb-2 block">Comportamiento</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MenuTarget)}
        className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {MENU_TARGETS.map((target) => (
          <option key={target} value={target}>
            {target === "_self" ? "Misma pestaña" : "Nueva pestaña"}
          </option>
        ))}
      </select>
    </div>
  );
}
