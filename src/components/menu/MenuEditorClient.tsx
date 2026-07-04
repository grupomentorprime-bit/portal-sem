"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContentGrid, KpiCard, Section } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { countVisibleItems } from "@/lib/cms/menu-utils";
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

  const visibleCount = countVisibleItems(menu.items);
  const levelCount = Math.max(0, ...menu.items.map((item) => item.level ?? 0)) + 1;

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Portal", href: "/admin/pages" },
        { label: "Menús", href: "/admin/menus" },
        { label: menu.name },
      ]}
      title={menu.name}
      description={`${menu.location} · ${menu.items.length} ítems · ${menu.active ? "Activo" : "Inactivo"}`}
      actions={
        <div className="flex items-center gap-3">
          <SaveLabel status={saveStatus} isDirty={isDirty} />
          <Link href="/admin/menus">
            <Button variant="outline">Volver a menús</Button>
          </Link>
          <Button onClick={handleSave} disabled={saveStatus === "saving" || !isDirty}>
            Guardar
          </Button>
        </div>
      }
    >
      <ContentGrid cols={3} className="mb-6">
        <KpiCard label="Ítems totales" value={menu.items.length} />
        <KpiCard label="Visibles" value={visibleCount} variant="success" />
        <KpiCard label="Niveles" value={levelCount} variant="info" />
      </ContentGrid>

      {error ? (
        <div className="mb-4 rounded-lg border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <Section title="Configuración del menú" description="Nombre y ubicación en el sitio.">
            <Card>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
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
          </Section>

          <Section title="Ítems de navegación" description="Arrastra para reordenar.">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Listado</CardTitle>
                    <CardDescription>Selecciona un ítem para editarlo en el panel lateral.</CardDescription>
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
          </Section>

          <Section title="Vista previa">
            <MenuPreview items={menu.items} />
          </Section>
        </div>

        <aside className="w-full shrink-0 border-t border-border pt-6 lg:w-80 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Editor de ítem</h2>
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
            <p className="text-sm text-muted">
              Selecciona un ítem de la lista para editar enlace, visibilidad y jerarquía.
            </p>
          )}
        </aside>
      </div>
    </AdminModulePage>
  );
}

function SaveLabel({
  status,
  isDirty,
}: {
  status: "idle" | "saving" | "saved" | "error";
  isDirty: boolean;
}) {
  if (status === "saving") return <span className="text-sm text-muted">Guardando…</span>;
  if (status === "saved") return <span className="text-sm text-success">Guardado</span>;
  if (status === "error") return <span className="text-sm text-[var(--color-danger)]">Error</span>;
  if (isDirty) return <span className="text-sm text-[var(--color-warning)]">Sin guardar</span>;
  return <span className="text-sm text-gray-400">Sin cambios</span>;
}
