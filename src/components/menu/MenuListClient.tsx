"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Menu, Navigation } from "lucide-react";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
  AdminModuleStats,
} from "@/components/admin/AdminModuleCenter";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    const newId = `${menu._id}-copy`;
    const res = await fetch("/api/cms/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: newId,
        name: `${menu.name} (copia)`,
        location: menu.location,
        active: false,
        items: menu.items,
      }),
    });
    const data = await res.json();
    if (data.ok) router.push(`/admin/menus/${newId}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`¿Eliminar menú "${id}"?`)) return;
    await fetch(`/api/cms/menus/${id}`, { method: "DELETE" });
    await refresh();
  };

  const activeMenus = useMemo(() => menus.filter((menu) => menu.active).length, [menus]);

  return (
    <AdminModuleLayout
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
      <AdminModuleCenter>
        {error ? (
          <div className="mb-4 rounded-lg border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        ) : null}

        <AdminModuleHero {...ADMIN_PANEL_META.menus} />

        <AdminModuleStats
          items={[
            { label: "Menús totales", value: menus.length, icon: Menu, tone: "total" },
            { label: "Activos", value: activeMenus, icon: Navigation, tone: "active" },
            {
              label: "Ítems visibles",
              value: menus.reduce((sum, menu) => sum + countVisibleItems(menu.items), 0),
              icon: Layers,
              tone: "published",
            },
          ]}
        />

        <AdminModuleSectionHeader
          icon={Menu}
          title="Menús configurados"
          description="Edita enlaces, duplica estructuras y activa ubicaciones del header o footer."
        />

        {showCreate ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Nuevo menú</CardTitle>
            </CardHeader>
            <div className="grid gap-4 sm:grid-cols-3">
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
            <div className="mt-4 flex gap-2">
              <Button onClick={handleCreate} disabled={loading}>Crear</Button>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <Card key={menu._id}>
              <CardHeader>
                <CardTitle>{menu.name}</CardTitle>
                <CardDescription>
                  {menu.location} · {countVisibleItems(menu.items)} ítems
                </CardDescription>
              </CardHeader>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    menu.active
                      ? "bg-success/15 text-success"
                      : "bg-background-muted text-muted"
                  }`}
                >
                  {menu.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/menus/${menu._id}`}>
                  <Button variant="secondary">Editar</Button>
                </Link>
                <Button variant="ghost" onClick={() => handleToggle(menu)}>
                  {menu.active ? "Desactivar" : "Activar"}
                </Button>
                <Button variant="ghost" onClick={() => handleDuplicate(menu)}>
                  Duplicar
                </Button>
                <Button variant="ghost" onClick={() => handleDelete(menu._id)}>
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {menus.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">
            No hay menús. Crea uno o inicializa los predeterminados.
          </p>
        ) : null}
      </AdminModuleCenter>
    </AdminModuleLayout>
  );
}
