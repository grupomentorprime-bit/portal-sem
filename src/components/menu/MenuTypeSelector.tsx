"use client";

import { MENU_TYPE_LABELS } from "@/components/menu/menu-icons";
import { Label } from "@/components/ui/label";
import { MENU_ITEM_TYPES, type MenuItemType } from "@/types/menu";

interface MenuTypeSelectorProps {
  value: MenuItemType;
  onChange: (value: MenuItemType) => void;
}

export function MenuTypeSelector({ value, onChange }: MenuTypeSelectorProps) {
  return (
    <div>
      <Label className="mb-2 block">Tipo de navegación</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MenuItemType)}
        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
      >
        {MENU_ITEM_TYPES.map((type) => (
          <option key={type} value={type}>
            {MENU_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </div>
  );
}
