"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ExternalLink, Image, Layers, Plus } from "lucide-react";
import {
  AlertBanner,
  ContentGrid,
  KpiCard,
  LoadingState,
  QuickActions,
  Section,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
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
  const collectionsWithContent = useMemo(
    () => Object.values(counts).filter((n) => n > 0).length,
    [counts]
  );
  const emptySections = useMemo(() => {
    const sections = [...primarySections, ...secondarySections].filter((s) => s.collection);
    return sections.filter((s) => (counts[s.collection!] ?? 0) === 0).length;
  }, [counts, primarySections, secondarySections]);

  return (
    <AdminModulePage
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
            <Button type="button" variant="outline">
              Ver portal público
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="/admin/media">
            <Button type="button" variant="outline">
              Biblioteca de medios
              <Image className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button type="button" onClick={handleSeed} disabled={loading} variant="secondary">
            {loading ? "Preparando…" : "Contenido de ejemplo"}
          </Button>
        </>
      }
    >
      {loading ? <LoadingState variant="cards" className="mb-6" /> : null}

      {error ? (
        <AlertBanner variant="error" title="Error" className="mb-6">
          {error}
        </AlertBanner>
      ) : null}

      <ContentGrid cols={4} className="mb-6">
        <KpiCard label="Secciones activas" value={activeSections} />
        <KpiCard label="Elementos editoriales" value={totalItems} variant="info" />
        <KpiCard label="Colecciones con contenido" value={collectionsWithContent} variant="success" />
        <KpiCard
          label="Requieren atención"
          value={emptySections}
          variant={emptySections > 0 ? "warning" : "neutral"}
          delta={emptySections > 0 ? "Secciones sin contenido" : undefined}
        />
      </ContentGrid>

      <QuickActions
        className="mb-8"
        items={[
          ...(features.news
            ? [
                {
                  id: "news",
                  title: "Publicar noticia",
                  description: "Nuevo comunicado institucional",
                  href: "/admin/content/news/edit/new",
                  icon: <Plus className="h-5 w-5" aria-hidden="true" />,
                },
              ]
            : []),
          {
            id: "pages",
            title: "Editar páginas del portal",
            description: "Estructura y bloques del sitio",
            href: "/admin/pages",
            icon: <Layers className="h-5 w-5" aria-hidden="true" />,
          },
          {
            id: "media",
            title: "Subir imágenes",
            description: "Biblioteca visual del seminario",
            href: "/admin/media",
            icon: <Image className="h-5 w-5" aria-hidden="true" />,
          },
        ]}
      />

      <Section
        title="Accesos principales"
        description="Programas, noticias y piezas editoriales de mayor uso."
        className="mb-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {primarySections.map((section) => (
            <EditorialCard
              key={section.href}
              href={section.href}
              label={section.label}
              description={section.description}
              count={section.collection ? counts[section.collection] : undefined}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Más secciones"
        description="Galería, testimonios, agenda académica y recursos complementarios."
      >
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
      </Section>
    </AdminModulePage>
  );
}
