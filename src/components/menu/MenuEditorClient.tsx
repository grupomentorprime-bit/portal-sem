"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MenuItemEditor } from "@/components/menu/MenuItemEditor";
import { MenuPreview } from "@/components/menu/MenuPreview";
import { MenuSortableList } from "@/components/menu/MenuSortableList";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeItemLevels, generateMenuItemId } from "@/lib/cms/menu-utils";
import type { CmsMenu, MenuItem } from "@/types/menu";

interface MenuEditorClientProps {
  menu: CmsMenu;
}

export function MenuEditorClient({ menu: initialMenu }: MenuEditorClientProps) {
  const router = useRouter();
  const [menu, setMenu] = useState(initialMenu);
  const [baseline, setBaseline] = useState(initialMenu);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialMenu.items[0]?.id ?? null
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => menu.items.find((item) => item.id === selectedId) ?? null,
    [menu.items, selectedId]
  );

  const isDirty = useMemo(
    () => JSON.stringify(menu) !== JSON.stringify(baseline),
    [menu, baseline]
  );

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 3000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    setError(null);

    try {
      const res = await fetch(`/api/cms/menus/${menu._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: menu.name,
          location: menu.location,
          active: menu.active,
          items: menu.items,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? data.errors?.[0]?.message ?? "Error al guardar.");
        setSaveStatus("error");
        return;
      }

      setMenu(data.menu);
      setBaseline(data.menu);
      setSaveStatus("saved");
      router.refresh();
    } catch {
      setError("Error de red.");
      setSaveStatus("error");
    }
  }, [menu, router]);

  const handleItemsChange = (items: MenuItem[]) => {
    setMenu((prev) => ({ ...prev, items: computeItemLevels(items) }));
    setSaveStatus("idle");
  };

  const handleAddItem = () => {
    const newItem: MenuItem = {
      id: generateMenuItemId(),
      title: "Nuevo ítem",
      slug: "/",
      url: "",
      type: "internal",
      icon: "circle",
      parent: null,
      order: menu.items.filter((i) => !i.parent).length + 1,
      visible: true,
      active: true,
      target: "_self",
      nofollow: false,
      highlighted: false,
      badge: "",
      color: "",
      level: 0,
    };
    const items = computeItemLevels([...menu.items, newItem]);
    setMenu((prev) => ({ ...prev, items }));
    setSelectedId(newItem.id);
  };

  const handleDeleteItem = (id: string) => {
    const items = menu.items
      .filter((item) => item.id !== id && item.parent !== id)
      .map((item) => (item.parent === id ? { ...item, parent: null } : item));
    handleItemsChange(computeItemLevels(items));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <Link href="/admin/menus" className="text-sm text-zinc-500 hover:underline">
              ← Menús
            </Link>
            <h1 className="text-xl font-semibold">{menu.name}</h1>
            <p className="text-sm text-zinc-500">
              {menu.location} · {menu.items.length} ítems ·{" "}
              {menu.active ? "Activo" : "Inactivo"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SaveLabel status={saveStatus} isDirty={isDirty} />
            <Button onClick={handleSave} disabled={saveStatus === "saving" || !isDirty}>
              Guardar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-2 sm:px-6">
        {error ? (
          <div className="lg:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del menú</CardTitle>
            </CardHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block">Nombre</Label>
                <Input
                  value={menu.name}
                  onChange={(e) => setMenu((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-2 block">Ubicación</Label>
                <Input
                  value={menu.location}
                  onChange={(e) => setMenu((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ítems</CardTitle>
                  <CardDescription>Arrastra para reordenar.</CardDescription>
                </div>
                <Button variant="secondary" onClick={handleAddItem}>
                  + Agregar
                </Button>
              </div>
            </CardHeader>
            <MenuSortableList
              items={menu.items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={handleItemsChange}
              onDelete={handleDeleteItem}
            />
          </Card>

          <MenuPreview items={menu.items} />
        </div>

        <div>
          {selectedItem ? (
            <MenuItemEditor
              item={selectedItem}
              parentOptions={menu.items}
              onChange={(updated) => {
                const items = menu.items.map((item) =>
                  item.id === updated.id ? updated : item
                );
                handleItemsChange(computeItemLevels(items));
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Editor de ítem</CardTitle>
                <CardDescription>Selecciona un ítem de la lista para editarlo.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function SaveLabel({
  status,
  isDirty,
}: {
  status: "idle" | "saving" | "saved" | "error";
  isDirty: boolean;
}) {
  if (status === "saving") return <span className="text-sm text-zinc-500">Guardando…</span>;
  if (status === "saved") return <span className="text-sm text-emerald-600">Guardado</span>;
  if (status === "error") return <span className="text-sm text-red-600">Error</span>;
  if (isDirty) return <span className="text-sm text-amber-600">Sin guardar</span>;
  return <span className="text-sm text-zinc-400">Sin cambios</span>;
}
