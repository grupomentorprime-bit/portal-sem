"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus, Search } from "lucide-react";
import {
  EmptyState,
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/admin/kit";
import { PlatformCreateSpacePanel } from "@/components/platform/PlatformCreateSpacePanel";
import { PlatformSpaceActionsMenu } from "@/components/platform/PlatformSpaceActionsMenu";
import { SpaceTypeFallbackMark } from "@/components/platform/SpaceTypeFallbackMark";
import { subscribePlatformSpacesSearch } from "@/components/platform/PlatformShell";
import { Button } from "@/components/ui";
import { spaceTypeVisual } from "@/lib/platform/space-type-visual";
import type { PlatformSpaceListItem } from "@/lib/platform/spaces";
import { cn } from "@/lib/utils";

const SPACE_ROW_GRID =
  "lg:grid lg:grid-cols-[minmax(14rem,1.45fr)_minmax(7rem,0.85fr)_minmax(10rem,1.15fr)_4rem_6.75rem_auto] lg:items-center lg:gap-x-4";

function statusTone(status: PlatformSpaceListItem["status"]): StatusBadgeTone {
  switch (status) {
    case "active":
      return "active";
    case "suspended":
      return "error";
    case "inactive":
      return "inactive";
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

/** Thumb de fila: logo/cover reales o ícono del tipo de organización. */
function SpaceThumb({ space }: { space: PlatformSpaceListItem }) {
  if (space.coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={space.coverUrl}
        alt=""
        className="h-9 w-9 shrink-0 rounded-[10px] object-cover"
      />
    );
  }

  if (space.logoUrl) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-background-default)] p-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={space.logoUrl}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      </span>
    );
  }

  return (
    <SpaceTypeFallbackMark
      type={space.type}
      typeLabel={space.typeLabel}
      size="row"
    />
  );
}

export function PlatformSpacesCatalog({
  spaces,
  platformBaseDomain = null,
}: {
  spaces: PlatformSpaceListItem[];
  /** `PLATFORM_BASE_DOMAIN` resuelto en servidor; null en locales sin base. */
  platformBaseDomain?: string | null;
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState("all");

  const typeOptions = useMemo(() => {
    const labels = Array.from(
      new Set(spaces.map((space) => space.typeLabel).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "es"));
    return labels;
  }, [spaces]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    return subscribePlatformSpacesSearch((next) => {
      setQuery(next);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return spaces.filter((space) => {
      if (typeFilter !== "all" && space.typeLabel !== typeFilter) return false;
      if (!q) return true;
      const haystack = [
        space.name,
        space.typeLabel,
        space.statusLabel,
        space.primaryDomain,
        space.primarySite?.name,
        space.tagline,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, spaces, typeFilter]);

  return (
    <PlatformCreateSpacePanel platformBaseDomain={platformBaseDomain}>
      {({ open: openCreate, summary }) => (
        <section
          id="espacios"
          className="scroll-mt-20 overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white shadow-[0_10px_28px_-24px_rgba(14,79,144,0.45)]"
        >
          <div className="flex flex-col gap-3 border-b border-[var(--color-border-default)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[var(--gray-900)]">
                Espacios
              </h2>
              <p className="text-[12px] text-[var(--gray-500)]">
                {query.trim() || typeFilter !== "all"
                  ? `${filtered.length} de ${spaces.length}`
                  : `${spaces.length} organizaciones`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block min-w-[12rem] flex-1 sm:w-48">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-500)]"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar espacios…"
                  className="h-9 w-full rounded-lg border border-[var(--color-border-default)] bg-white pl-8 pr-3 text-[13px] text-[var(--gray-900)] outline-none transition focus:border-[var(--growth-os-secondary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--growth-os-secondary)_16%,transparent)]"
                />
              </label>
              {typeOptions.length > 1 ? (
                <label className="sr-only" htmlFor="platform-space-type-filter">
                  Filtrar por tipo
                </label>
              ) : null}
              {typeOptions.length > 1 ? (
                <select
                  id="platform-space-type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-9 rounded-lg border border-[var(--color-border-default)] bg-white px-2.5 text-[13px] text-[var(--gray-900)] outline-none transition focus:border-[var(--growth-os-secondary)]"
                >
                  <option value="all">Todos los tipos</option>
                  {typeOptions.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : null}
              <Button
                type="button"
                onClick={openCreate}
                className="h-9 shrink-0 rounded-lg bg-[var(--growth-os-primary)] px-3.5 text-[13px] hover:opacity-95"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Crear Espacio
              </Button>
            </div>
          </div>

          {summary ? <div className="px-4 pb-2 sm:px-5">{summary}</div> : null}

          {spaces.length === 0 ? (
            <div className="px-4 pb-4 sm:px-5">
              <EmptyState
                title="Sin Espacios"
                description="Todavía no hay organizaciones en Growth OS."
                action={{
                  label: "Crear Espacio",
                  onClick: openCreate,
                }}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 pb-4 sm:px-5">
              <EmptyState
                title="Sin resultados"
                description="Prueba con otro nombre, dominio o Sitio."
              />
            </div>
          ) : (
            <div>
              <div
                className={cn(
                  "hidden border-b border-[var(--color-border-default)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--gray-400)] sm:px-5 lg:grid",
                  SPACE_ROW_GRID
                )}
              >
                <span>Organización</span>
                <span>Sitio</span>
                <span>Subdominio</span>
                <span>Miembros</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>
              <div className="divide-y divide-[var(--color-border-default)]">
                {filtered.map((space) => {
                  const typeVisual = spaceTypeVisual(space.type);
                  return (
                    <div
                      key={space.tenantId}
                      className={cn(
                        "flex flex-col gap-2.5 px-4 py-3 transition hover:bg-[color-mix(in_srgb,var(--growth-os-primary)_3%,white)] sm:px-5 lg:py-2.5",
                        SPACE_ROW_GRID
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <SpaceThumb space={space} />
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <h3 className="truncate text-[14px] font-semibold tracking-[-0.02em] text-[var(--gray-900)]">
                              {space.name}
                            </h3>
                            <span
                              className={cn(
                                "hidden shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] sm:inline",
                                typeVisual.badgeBg,
                                typeVisual.iconFg
                              )}
                            >
                              {space.typeLabel}
                            </span>
                          </div>
                          {space.tagline ? (
                            <p className="mt-0.5 truncate text-[12px] text-[var(--gray-500)]">
                              {space.tagline}
                            </p>
                          ) : (
                            <p className="mt-0.5 truncate text-[12px] text-[var(--gray-500)] sm:hidden">
                              {space.typeLabel}
                            </p>
                          )}
                        </div>
                      </div>

                      <dl className="grid min-w-0 grid-cols-3 gap-3 lg:contents">
                        <div className="min-w-0">
                          <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--gray-400)] lg:sr-only">
                            Sitio
                          </dt>
                          <dd className="truncate text-[13px] text-[var(--gray-800)]">
                            {space.primarySite?.name ?? "—"}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt
                            className={cn(
                              "text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--gray-400)]",
                              space.primaryDomainKind === "custom"
                                ? ""
                                : "lg:sr-only"
                            )}
                          >
                            {space.primaryDomainKind === "custom"
                              ? "Dominio propio"
                              : "Subdominio"}
                          </dt>
                          <dd
                            className="truncate text-[13px] text-[var(--gray-700)]"
                            title={space.primaryDomain ?? undefined}
                          >
                            {space.primaryDomain ?? "—"}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--gray-400)] lg:sr-only">
                            Miembros
                          </dt>
                          <dd className="text-[13px] font-medium tabular-nums text-[var(--gray-800)]">
                            {space.memberCount}
                          </dd>
                        </div>
                      </dl>

                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--gray-400)] lg:sr-only">
                          Estado
                        </p>
                        <StatusBadge
                          tone={statusTone(space.status)}
                          className="gap-1.5 px-2 py-0.5 text-[11px]"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-current"
                            aria-hidden
                          />
                          {space.statusLabel}
                        </StatusBadge>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <p className="sr-only">Acciones</p>
                        <Link
                          href={`/platform/spaces/${encodeURIComponent(space.tenantId)}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--color-border-default)] bg-white px-2.5 text-[12px] font-semibold text-[var(--growth-os-primary)] transition hover:border-[color-mix(in_srgb,var(--growth-os-secondary)_45%,var(--border))] hover:bg-[var(--gray-100)]"
                        >
                          Ver espacio
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                        <PlatformSpaceActionsMenu
                          tenantId={space.tenantId}
                          spaceName={space.name}
                          status={space.status}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-[var(--color-border-default)]">
            <button
              type="button"
              onClick={openCreate}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[color-mix(in_srgb,var(--growth-os-primary)_3.5%,white)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-[color-mix(in_srgb,var(--growth-os-secondary)_55%,var(--color-border-default))] text-[var(--growth-os-primary)]">
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[var(--gray-900)]">
                  Agregar organización
                </span>
                <span className="block truncate text-[12px] text-[var(--gray-500)]">
                  Crea un Espacio y actívalo en pocos pasos.
                </span>
              </span>
              <ArrowRight
                className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--gray-400)]"
                aria-hidden
              />
            </button>
          </div>
        </section>
      )}
    </PlatformCreateSpacePanel>
  );
}
