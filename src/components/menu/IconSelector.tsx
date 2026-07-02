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
                ? "border-primary bg-primary text-text-inverse dark:border-gray-100 dark:bg-background-muted dark:text-foreground"
                : "border-border hover:border-gray-400 dark:border-gray-700"
            )}
          >
            <MenuIcon name={icon.id} />
          </button>
        ))}
      </div>
    </div>
  );
}
