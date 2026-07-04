"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AdminDataTable,
  ColumnActions,
  ContentGrid,
  EmptyState,
  FilterBar,
  KpiCard,
  LoadingState,
  StatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { countVisibleItems } from "@/lib/cms/menu-utils";
import { DEFAULT_MENUS } from "@/lib/cms/menu-defaults";
import type { CmsMenu } from "@/types/menu";

interface MenuListClientProps {
  initialMenus: CmsMenu[];
}

export function MenuListClient({ initialMenus }: MenuListClientProps) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [showCreate, setShowCreate] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("header");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { confirm, dialog } = useConfirmDialog();

  const refresh = useCallback(async () => {
    const res = await fetch("/api/cms/menus");
    const data = await res.json();
    if (data.ok) setMenus(data.menus);
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: newId,
          name: newName,
          location: newLocation,
          active: true,
          items: [],
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? data.errors?.[0]?.message ?? "Error al crear.");
        return;
      }
      setShowCreate(false);
      setNewId("");
      setNewName("");
      router.push(`/admin/menus/${data.menu._id}`);
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    try {
      for (const menu of DEFAULT_MENUS) {
        const exists = menus.some((m) => m._id === menu._id);
        if (!exists) {
          await fetch("/api/cms/menus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              _id: menu._id,
              name: menu.name,
              location: menu.location,
              active: menu.active,
              items: menu.items,
            }),
          });
        }
      }
      await refresh();
    } catch {
      setError("Error al inicializar menús.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (menu: CmsMenu) => {
    await fetch(`/api/cms/menus/${menu._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: menu.name,
        location: menu.location,
        active: !menu.active,
        items: menu.items,
      }),
    });
    await refresh();
  };

  const handleDuplicate = async (menu: CmsMenu) => {
    const newMenuId = `${menu._id}-copy`;
    const res = await fetch("/api/cms/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: newMenuId,
        name: `${menu.name} (copia)`,
        location: menu.location,
        active: false,
        items: menu.items,
      }),
    });
    const data = await res.json();
    if (data.ok) router.push(`/admin/menus/${newMenuId}`);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Eliminar menú",
      description: `¿Eliminar el menú "${id}"? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    await fetch(`/api/cms/menus/${id}`, { method: "DELETE" });
    await refresh();
  };

  const activeMenus = useMemo(() => menus.filter((menu) => menu.active).length, [menus]);
  const visibleItems = useMemo(
    () => menus.reduce((sum, menu) => sum + countVisibleItems(menu.items), 0),
    [menus]
  );

  const filteredMenus = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return menus;
    return menus.filter(
      (menu) =>
        menu.name.toLowerCase().includes(query) ||
        menu._id.toLowerCase().includes(query) ||
        menu.location.toLowerCase().includes(query)
    );
  }, [menus, search]);

  const columns: AdminDataTableColumn<CmsMenu>[] = [
    {
      id: "name",
      header: "Menú",
      cell: (menu) => (
        <div>
          <p className="font-medium text-foreground">{menu.name}</p>
          <p className="text-xs text-muted">
            {menu.location} · {countVisibleItems(menu.items)} ítems
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Estado",
      cell: (menu) => (
        <StatusBadge tone={menu.active ? "active" : "inactive"} />
      ),
    },
    {
      id: "id",
      header: "ID",
      cell: (menu) => <span className="font-mono text-xs text-muted">{menu._id}</span>,
    },
  ];

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Portal", href: "/admin/pages" },
        { label: "Menús" },
      ]}
      title="Menús del portal"
      description="Navegación principal y secundaria del sitio institucional"
      actions={
        <>
          <Link href="/admin/pages">
            <Button variant="outline">Páginas</Button>
          </Link>
          {menus.length === 0 ? (
            <Button variant="secondary" onClick={handleSeed} disabled={loading}>
              Inicializar menús
            </Button>
          ) : null}
          <Button onClick={() => setShowCreate(true)}>Crear menú</Button>
        </>
      }
    >
      {error ? (
        <div className="mb-4 rounded-lg border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}

      {loading ? <LoadingState variant="cards" className="mb-6" /> : null}

      <ContentGrid cols={3} className="mb-6">
        <KpiCard label="Menús totales" value={menus.length} />
        <KpiCard label="Activos" value={activeMenus} variant="success" />
        <KpiCard label="Ítems visibles" value={visibleItems} variant="info" />
      </ContentGrid>

      {showCreate ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nuevo menú</CardTitle>
          </CardHeader>
          <div className="grid gap-4 px-6 pb-6 sm:grid-cols-3">
            <div>
              <Label className="mb-2 block">ID</Label>
              <Input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="main" />
            </div>
            <div>
              <Label className="mb-2 block">Nombre</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Menú Principal" />
            </div>
            <div>
              <Label className="mb-2 block">Ubicación</Label>
              <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="header" />
            </div>
          </div>
          <div className="flex gap-2 px-6 pb-6">
            <Button onClick={handleCreate} disabled={loading}>
              Crear
            </Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      ) : null}

      <FilterBar
        className="mb-4"
        search={{
          placeholder: "Buscar por nombre, ID o ubicación…",
          value: search,
          onChange: setSearch,
        }}
        onReset={search ? () => setSearch("") : undefined}
      />

      {menus.length === 0 ? (
        <EmptyState
          title="Sin menús"
          description="Crea uno nuevo o inicializa los menús predeterminados."
          action={{ label: "Inicializar menús", onClick: handleSeed }}
        />
      ) : (
        <AdminDataTable
          columns={columns}
          data={filteredMenus}
          rowKey={(menu) => menu._id}
          emptyTitle="Sin resultados"
          emptyDescription="Prueba con otros términos de búsqueda."
          rowActions={(menu) => (
            <ColumnActions>
              <Link href={`/admin/menus/${menu._id}`}>
                <Button variant="secondary" size="sm">
                  Editar
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => handleToggle(menu)}>
                {menu.active ? "Desactivar" : "Activar"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDuplicate(menu)}>
                Duplicar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(menu._id)}>
                Eliminar
              </Button>
            </ColumnActions>
          )}
        />
      )}

      {dialog}
    </AdminModulePage>
  );
}
