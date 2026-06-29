"use client";

import { IconSelector } from "@/components/menu/IconSelector";
import { MenuTargetSelector } from "@/components/menu/MenuTargetSelector";
import { MenuTypeSelector } from "@/components/menu/MenuTypeSelector";
import { MenuVisibilitySwitch } from "@/components/menu/MenuVisibilitySwitch";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { MenuItem } from "@/types/menu";

interface MenuItemEditorProps {
  item: MenuItem;
  parentOptions: MenuItem[];
  onChange: (item: MenuItem) => void;
}

export function MenuItemEditor({ item, parentOptions, onChange }: MenuItemEditorProps) {
  const update = <K extends keyof MenuItem>(key: K, value: MenuItem[K]) => {
    onChange({ ...item, [key]: value });
  };

  const availableParents = parentOptions.filter(
    (parent) => parent.id !== item.id
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Datos básicos del ítem de menú.</CardDescription>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">Título</Label>
            <Input value={item.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Slug</Label>
            <Input value={item.slug} onChange={(e) => update("slug", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <MenuTypeSelector value={item.type} onChange={(type) => update("type", type)} />
          </div>
          {item.type === "external" ? (
            <div className="sm:col-span-2">
              <Label className="mb-2 block">URL</Label>
              <Input value={item.url} onChange={(e) => update("url", e.target.value)} />
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <IconSelector value={item.icon} onChange={(icon) => update("icon", icon)} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jerarquía</CardTitle>
          <CardDescription>Submenús sin límite de niveles.</CardDescription>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">Padre</Label>
            <select
              value={item.parent ?? ""}
              onChange={(e) => update("parent", e.target.value || null)}
              className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Sin padre (raíz)</option>
              {availableParents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-2 block">Orden</Label>
            <Input
              type="number"
              min={1}
              value={item.order}
              onChange={(e) => update("order", Number(e.target.value))}
            />
          </div>
          <div>
            <Label className="mb-2 block">Nivel</Label>
            <Input value={item.level} disabled />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comportamiento</CardTitle>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <MenuTargetSelector value={item.target} onChange={(target) => update("target", target)} />
          <div>
            <Label className="mb-2 block">Badge</Label>
            <Input value={item.badge} onChange={(e) => update("badge", e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Color</Label>
            <Input
              value={item.color}
              onChange={(e) => update("color", e.target.value)}
              placeholder="#003B73"
            />
          </div>
          <Switch
            label="Destacado"
            description="Resaltar visualmente este ítem."
            checked={item.highlighted}
            onChange={(highlighted) => update("highlighted", highlighted)}
          />
          <Switch
            label="nofollow"
            description="Agregar rel=nofollow al enlace."
            checked={item.nofollow}
            onChange={(nofollow) => update("nofollow", nofollow)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visibilidad</CardTitle>
        </CardHeader>
        <MenuVisibilitySwitch
          visible={item.visible}
          active={item.active}
          onVisibleChange={(visible) => update("visible", visible)}
          onActiveChange={(active) => update("active", active)}
        />
      </Card>
    </div>
  );
}
