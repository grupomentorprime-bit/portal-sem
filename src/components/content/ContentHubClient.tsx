"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALLOWED_COLLECTIONS } from "@/lib/content/types";

const CONTENT_SECTIONS = [
  { href: "/admin/content/programs", label: "Programas", collection: "academy_programs" },
  { href: "/admin/content/news", label: "Noticias", collection: "content_news" },
  { href: "/admin/content/team", label: "Equipo", collection: "academy_team" },
  { href: "/admin/content/library", label: "Biblioteca", collection: "content_library" },
  { href: "/admin/content/events", label: "Eventos", collection: "content_events" },
  { href: "/admin/content/testimonials", label: "Testimonios", collection: "academy_testimonials" },
  { href: "/admin/content/gallery", label: "Galería", collection: "academy_gallery" },
  { href: "/admin/content/categories", label: "Categorías", collection: "academy_categories" },
] as const;

interface ContentHubClientProps {
  tenant: string;
  initialCounts: Record<string, number>;
}

export function ContentHubClient({ tenant, initialCounts }: ContentHubClientProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCounts = useCallback(async () => {
    const next: Record<string, number> = {};
    for (const section of CONTENT_SECTIONS) {
      const res = await fetch(
        `/api/cms/content-query?tenant=${encodeURIComponent(tenant)}&collection=${section.collection}&limit=1`
      );
      const data = await res.json();
      next[section.collection] = data.ok ? data.total : 0;
    }
    setCounts(next);
  }, [tenant]);

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
        setError(data.error ?? "Error al inicializar contenido.");
        return;
      }
      await refreshCounts();
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">CMS</p>
            <h1 className="text-xl font-semibold">Contenido</h1>
            <p className="text-sm text-zinc-500">Content Engine — tenant: {tenant}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/pages">
              <Button variant="secondary">Páginas</Button>
            </Link>
            <Button onClick={handleSeed} disabled={loading}>
              Inicializar contenido
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Colecciones</CardTitle>
              <CardDescription>{ALLOWED_COLLECTIONS.length} oficiales registradas</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Motor</CardTitle>
              <CardDescription>POST /api/cms/content-query</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado editorial</CardTitle>
              <CardDescription>Solo publicado en sitio público</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT_SECTIONS.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{section.label}</CardTitle>
                  <CardDescription>
                    {section.collection} · {counts[section.collection] ?? 0} documentos
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
