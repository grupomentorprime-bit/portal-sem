"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { BookOpen, FileText, Layers, Newspaper } from "lucide-react";
import { AdminModuleLayout, AdminQuickActions } from "@/components/admin/AdminModuleLayout";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
  AdminModuleStats,
} from "@/components/admin/AdminModuleCenter";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import {
  CONTENT_EDITORIAL_PRIMARY,
  CONTENT_EDITORIAL_SECONDARY,
} from "@/lib/admin/institutional";
import { isAdminSectionEnabled } from "@/lib/portal/feature-flags";
import type { FeatureFlags } from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ContentHubClientProps {
  tenant: string;
  features: FeatureFlags;
  initialCounts: Record<string, number>;
}

function EditorialCard({
  href,
  label,
  description,
  count,
}: {
  href: string;
  label: string;
  description: string;
  count?: number;
}) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full border-border transition group-hover:border-primary/30 group-hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">{label}</CardTitle>
          <CardDescription>{description}</CardDescription>
          {count !== undefined ? (
            <p className="pt-2 text-xs font-medium text-muted">
              {count} {count === 1 ? "elemento" : "elementos"}
            </p>
          ) : null}
        </CardHeader>
      </Card>
    </Link>
  );
}

export function ContentHubClient({ tenant, features, initialCounts }: ContentHubClientProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primarySections = useMemo(
    () =>
      CONTENT_EDITORIAL_PRIMARY.filter((section) =>
        isAdminSectionEnabled(features, section.href)
      ),
    [features]
  );
  const secondarySections = useMemo(
    () =>
      CONTENT_EDITORIAL_SECONDARY.filter((section) =>
        isAdminSectionEnabled(features, section.href)
      ),
    [features]
  );

  const refreshCounts = useCallback(async () => {
    const next: Record<string, number> = {};
    const sections = [...primarySections, ...secondarySections];
    for (const section of sections) {
      if (!section.collection) continue;
      const res = await fetch(
        `/api/cms/content-query?tenant=${encodeURIComponent(tenant)}&collection=${section.collection}&limit=1`
      );
      const data = await res.json();
      next[section.collection] = data.ok ? data.total : 0;
    }
    setCounts(next);
  }, [tenant, primarySections, secondarySections]);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/content-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo preparar el contenido inicial.");
        return;
      }
      await refreshCounts();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const totalItems = useMemo(
    () => Object.values(counts).reduce((sum, n) => sum + n, 0),
    [counts]
  );
  const activeSections = primarySections.length + secondarySections.length;

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Comunicaciones", href: "/admin/content" },
        { label: "Centro editorial" },
      ]}
      title="Centro editorial"
      description="Gestiona programas, noticias, personas y recursos del portal SEM"
      actions={
        <>
          <Link href="/" target="_blank">
            <Button variant="outline">Ver portal público</Button>
          </Link>
          <Link href="/admin/media">
            <Button variant="outline">Biblioteca de medios</Button>
          </Link>
          <Button onClick={handleSeed} disabled={loading} variant="secondary">
            {loading ? "Preparando…" : "Contenido de ejemplo"}
          </Button>
        </>
      }
    >
      <AdminModuleCenter>
        {error ? (
          <div className="mb-6 rounded-xl border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        ) : null}

        <AdminModuleHero {...ADMIN_PANEL_META.content} />

        <AdminModuleStats
          items={[
            {
              label: "Secciones activas",
              value: activeSections,
              icon: Layers,
              tone: "total",
            },
            {
              label: "Elementos editoriales",
              value: totalItems,
              icon: FileText,
              tone: "active",
            },
            {
              label: "Colecciones con contenido",
              value: Object.values(counts).filter((n) => n > 0).length,
              icon: BookOpen,
              tone: "published",
            },
          ]}
        />

      <section className="mb-10">
        <AdminModuleSectionHeader
          icon={Newspaper}
          title="Accesos principales"
          description="Programas, noticias y piezas editoriales de mayor uso."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {primarySections.map((section) => (
            <EditorialCard
              key={section.href}
              href={section.href}
              label={section.label}
              description={section.description}
              count={
                section.collection ? counts[section.collection] : undefined
              }
            />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <AdminModuleSectionHeader
          icon={BookOpen}
          title="Más secciones"
          description="Galería, testimonios, agenda académica y recursos complementarios."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {secondarySections.map((section) => (
            <EditorialCard
              key={section.href}
              href={section.href}
              label={section.label}
              description={section.description}
              count={counts[section.collection] ?? 0}
            />
          ))}
        </div>
      </section>

      <section>
        <AdminModuleSectionHeader
          icon={FileText}
          title="Acciones rápidas"
          description="Atajos para publicar y mantener el portal actualizado."
        />
        <AdminQuickActions
          items={[
            ...(features.news
              ? [
                  {
                    href: "/admin/content/news/edit/new",
                    label: "Publicar noticia",
                    description: "Nuevo comunicado institucional",
                  },
                ]
              : []),
            {
              href: "/admin/pages",
              label: "Editar páginas del portal",
              description: "Estructura y bloques del sitio",
            },
            {
              href: "/admin/media",
              label: "Subir imágenes",
              description: "Biblioteca visual del seminario",
            },
          ]}
        />
      </section>
      </AdminModuleCenter>
    </AdminModuleLayout>
  );
}
