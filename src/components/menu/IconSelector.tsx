"use client";

import { MENU_ICONS, MenuIcon } from "@/components/menu/menu-icons";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface IconSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconSelector({ value, onChange }: IconSelectorProps) {
  return (
    <div>
      <Label className="mb-2 block">Icono</Label>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {MENU_ICONS.map((icon) => (
          <button
            key={icon.id}
            type="button"
            title={icon.label}
            onClick={() => onChange(icon.id)}
            className={cn(
              "flex h-10 items-center justify-center rounded-lg border transition",
              value === icon.id
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
            )}
          >
            <MenuIcon name={icon.id} />
          </button>
        ))}
      </div>
    </div>
  );
}
