"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalLink, Eye, FileStack, Layers, LayoutTemplate } from "lucide-react";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
  AdminModuleStats,
} from "@/components/admin/AdminModuleCenter";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import { Button, Card, Badge } from "@/components/ui";
import { blocksFromTemplate } from "@/lib/cms/page-defaults";
import { normalizeSlug } from "@/lib/cms/page-utils";
import type { CmsPage, CmsTemplate } from "@/types/page";

interface PageListClientProps {
  pages: CmsPage[];
  templates: CmsTemplate[];
  tenant: string;
}

export function PageListClient({ pages, templates, tenant }: PageListClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const seedCms = async () => {
    setLoading(true);
    await fetch("/api/cms/blocks?seed=true");
    await fetch("/api/cms/templates?seed=true");
    setLoading(false);
    router.refresh();
  };

  const createPage = async () => {
    const id = prompt("ID de la página (ej: programas):");
    if (!id) return;
    const title = prompt("Título:", "Nueva página") ?? "Nueva página";
    const slug = normalizeSlug(prompt("Slug:", `/${id}`) ?? `/${id}`);
    const templateId = templates[0]?._id ?? "landing";
    const template = templates.find((t) => t._id === templateId) ?? templates[0];
    const blocks = template ? blocksFromTemplate(template) : [];

    setLoading(true);
    const res = await fetch("/api/cms/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: id,
        tenant,
        title,
        slug,
        description: "",
        template: template?.template ?? "institutional",
        status: "draft",
        seo: { title, description: "" },
        blocks,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) router.push(`/admin/pages/${id}`);
    else alert(data.error ?? "Error al crear página");
  };

  const deletePage = async (id: string) => {
    if (!confirm(`¿Eliminar página "${id}"?`)) return;
    setLoading(true);
    await fetch(`/api/cms/pages/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  };

  const duplicatePage = async (page: CmsPage) => {
    const newId = prompt("Nuevo ID:", `${page._id}-copia`);
    if (!newId) return;
    setLoading(true);
    const res = await fetch(`/api/cms/pages/${page._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        duplicateAs: {
          newId,
          newTitle: `${page.title} (copia)`,
          newSlug: `${page.slug === "/" ? "" : page.slug}-copia`,
        },
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) router.push(`/admin/pages/${newId}`);
  };

  const publishedCount = useMemo(
    () => pages.filter((page) => page.status === "published").length,
    [pages]
  );
  const draftCount = pages.length - publishedCount;

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Portal", href: "/admin/pages" },
        { label: "Páginas del sitio" },
      ]}
      title="Páginas del portal"
      description="Estructura, bloques y contenido de cada página institucional"
      actions={
        <>
          <Link href="/admin/menus">
            <Button type="button" variant="outline">
              Menús
            </Button>
          </Link>
          <Link href="/" target="_blank">
            <Button type="button" variant="outline">
              Ver portal
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button type="button" variant="outline" disabled={loading} onClick={seedCms}>
            Preparar plantillas
          </Button>
          <Button type="button" disabled={loading} onClick={createPage}>
            Nueva página
          </Button>
        </>
      }
    >
      <AdminModuleCenter>
        <AdminModuleHero {...ADMIN_PANEL_META.pages} />
        <AdminModuleStats
          items={[
            { label: "Páginas totales", value: pages.length, icon: Layers, tone: "total" },
            { label: "Publicadas", value: publishedCount, icon: Eye, tone: "published" },
            { label: "Borradores", value: draftCount, icon: FileStack, tone: "active" },
          ]}
        />
        <AdminModuleSectionHeader
          icon={LayoutTemplate}
          title="Páginas del sitio"
          description="Edita bloques, duplica plantillas y abre la vista pública de cada página."
        />
      <div className="grid gap-4">
          {pages.length === 0 ? (
            <Card className="p-8 text-center text-muted">
              No hay páginas. Usa &quot;Inicializar CMS&quot; para crear la biblioteca y la home.
            </Card>
          ) : (
            pages.map((page) => (
              <Card key={page._id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-heading text-foreground">{page.title}</h2>
                    <Badge variant={page.status === "published" ? "success" : "neutral"}>
                      {page.status}
                    </Badge>
                  </div>
                  <p className="text-caption text-muted">
                    {page.slug} · {page.blocks.length} bloques
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button href={`/admin/pages/${page._id}`} variant="primary" size="sm">
                    Editar
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => duplicatePage(page)}>
                    Duplicar
                  </Button>
                  {page._id !== "home" ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => deletePage(page._id)}>
                      Eliminar
                    </Button>
                  ) : null}
                  {page.status === "published" ? (
                    <Link href={page.slug} className="text-caption text-secondary underline" target="_blank">
                      Ver
                    </Link>
                  ) : null}
                </div>
              </Card>
            ))
          )}
        </div>
      </AdminModuleCenter>
    </AdminModuleLayout>
  );
}
