"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

  return (
    <div className="min-h-screen bg-background-soft">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-caption font-semibold uppercase tracking-widest text-muted">CMS</p>
            <h1 className="text-display-l text-foreground">Constructor de Páginas</h1>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={loading} onClick={seedCms}>
              Inicializar CMS
            </Button>
            <Button type="button" disabled={loading} onClick={createPage}>
              Nueva página
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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
      </div>
    </div>
  );
}
