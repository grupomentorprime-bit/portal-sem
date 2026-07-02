"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TEAM_GROUPS, getTeamGroup, getTeamGroupBySlug } from "@/lib/content/team-groups";
import type { ContentDocument } from "@/types/content";
import { cn } from "@/lib/utils";

interface PeopleListClientProps {
  tenant: string;
  initialItems: ContentDocument[];
  initialTotal: number;
}

export function PeopleListClient({
  tenant,
  initialItems,
  initialTotal,
}: PeopleListClientProps) {
  const searchParams = useSearchParams();
  const groupSlug = searchParams.get("group");
  const activeGroup = getTeamGroupBySlug(groupSlug) ?? null;

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
          collection: "content_people",
          pagination: { page: 1, limit: 100 },
          preview: true,
          mapItems: false,
          filters: activeGroup ? { category: activeGroup.id } : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.errors?.[0]?.message ?? data.error ?? "No se pudo cargar el equipo.");
        return;
      }
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, [tenant, activeGroup]);

  const filteredItems = useMemo(() => {
    if (!activeGroup) return items;
    return items.filter((item) => item.category === activeGroup.id);
  }, [items, activeGroup]);

  const countsByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of TEAM_GROUPS) {
      counts[group.id] = items.filter((item) => item.category === group.id).length;
    }
    return counts;
  }, [items]);

  const newHref = activeGroup
    ? `/admin/content/people/edit/new?group=${activeGroup.slug}`
    : "/admin/content/people/edit/new?group=leadership";

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Comunicaciones", href: "/admin/content" },
        { label: "Personas" },
      ]}
      title="Personas del seminario"
      description="Gestiona el equipo directivo, docente y técnico por separado"
      actions={
        <>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </Button>
          <Link href={newHref}>
            <Button>Nueva persona</Button>
          </Link>
        </>
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/content/people"
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition",
            !activeGroup
              ? "border-primary bg-primary text-[var(--text-inverse)]"
              : "border-border bg-background text-muted hover:border-primary/30"
          )}
        >
          Todos ({total})
        </Link>
        {TEAM_GROUPS.map((group) => (
          <Link
            key={group.id}
            href={`/admin/content/people?group=${group.slug}`}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              activeGroup?.id === group.id
                ? "border-primary bg-primary text-[var(--text-inverse)]"
                : "border-border bg-background text-muted hover:border-primary/30"
            )}
          >
            {group.label} ({countsByGroup[group.id] ?? 0})
          </Link>
        ))}
      </div>

      {activeGroup ? (
        <p className="mb-4 text-sm text-muted">{activeGroup.description}</p>
      ) : null}

      <div className="grid gap-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted">
              {activeGroup
                ? `No hay personas en «${activeGroup.label}».`
                : "No hay personas registradas."}
            </p>
            <Link href={newHref} className="mt-4 inline-block">
              <Button size="sm">Agregar primera persona</Button>
            </Link>
          </div>
        ) : (
          filteredItems.map((item) => {
            const group = getTeamGroup(item.category);
            return (
              <Link
                key={item._id}
                href={`/admin/content/people/edit/${item._id}`}
                className="block"
              >
                <Card className="transition hover:border-primary/30 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-background-soft">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                          Sin foto
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">
                        {item.name ?? item.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {item.role ?? "Sin cargo"}
                        {group ? ` · ${group.label}` : ""}
                      </CardDescription>
                      <p className="mt-1 text-xs text-muted">
                        {item.status ?? "borrador"}
                        {item.featured ? " · destacado" : ""}
                        {item.order !== undefined ? ` · orden ${item.order}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-secondary">Editar →</span>
                  </CardHeader>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </AdminModuleLayout>
  );
}
