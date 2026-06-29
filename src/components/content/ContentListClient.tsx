"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentDocument } from "@/types/content";

interface ContentListClientProps {
  tenant: string;
  collection: string;
  title: string;
  description: string;
  initialItems: ContentDocument[];
  initialTotal: number;
}

export function ContentListClient({
  tenant,
  collection,
  title,
  description,
  initialItems,
  initialTotal,
}: ContentListClientProps) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/content-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant,
          collection,
          pagination: { page: 1, limit: 50 },
          preview: true,
          mapItems: false,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.errors?.[0]?.message ?? data.error ?? "Error al cargar.");
        return;
      }
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }, [tenant, collection]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <Link href="/admin/content" className="text-sm text-zinc-500 hover:text-zinc-800">
              ← Contenido
            </Link>
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-sm text-zinc-500">{description}</p>
          </div>
          <Button variant="secondary" onClick={load} disabled={loading}>
            Actualizar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{collection}</CardTitle>
            <CardDescription>{total} documentos · tenant {tenant}</CardDescription>
          </CardHeader>
        </Card>

        {loading ? (
          <p className="text-sm text-zinc-500">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Sin contenido. Usa &quot;Inicializar contenido&quot; en el hub de Contenido.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {items.map((item) => (
              <li key={item._id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{item.title || item.name || item._id}</p>
                  <p className="text-xs text-zinc-500">
                    {item.status ?? "—"} · {item.slug}
                    {item.featured ? " · destacado" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
