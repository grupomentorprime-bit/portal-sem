"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Globe2,
  Plus,
  Search,
  Users,
} from "lucide-react";
import {
  EmptyState,
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/admin/kit";
import { PlatformCreateSpacePanel } from "@/components/platform/PlatformCreateSpacePanel";
import { subscribePlatformSpacesSearch } from "@/components/platform/PlatformShell";
import { Button } from "@/components/ui";
import type { PlatformSpaceListItem } from "@/lib/platform/spaces";
import { cn } from "@/lib/utils";

function statusTone(status: PlatformSpaceListItem["status"]): StatusBadgeTone {
  switch (status) {
    case "active":
      return "active";
    case "suspended":
      return "error";
    case "inactive":
      return "inactive";
    default:
      return "neutral";
  }
}

/** Thumb de fila: logo/cover reales o fallback. */
function SpaceThumb({ space }: { space: PlatformSpaceListItem }) {
  if (space.coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={space.coverUrl}
        alt=""
        className="h-[88px] w-[100px] shrink-0 rounded-[14px] object-cover"
      />
    );
  }

  if (space.logoUrl) {
    return (
      <span className="flex h-[88px] w-[100px] shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-background-default)] p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={space.logoUrl}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      </span>
    );
  }

  const initial = space.name.trim().charAt(0).toUpperCase() || "E";
  return (
    <span
      className="relative flex h-[88px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-br from-[var(--gray-100)] via-white to-[color-mix(in_srgb,var(--growth-os-secondary)_16%,white)]"
      aria-hidden
    >
      <span className="absolute -right-4 -top-5 h-16 w-16 rounded-full bg-[var(--growth-os-secondary)]/18" />
      <span className="absolute -bottom-5 left-2 h-14 w-14 rounded-[14px] bg-[var(--growth-os-primary)]/10" />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-[12px] bg-white text-[18px] font-bold tracking-tight text-[var(--growth-os-primary)] shadow-[0_6px_14px_-10px_rgba(14,79,144,0.45)]">
        {initial}
      </span>
    </span>
  );
}

export function PlatformSpacesCatalog({
  spaces,
}: {
  spaces: PlatformSpaceListItem[];
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
    <PlatformCreateSpacePanel>
      {({ open: openCreate, summary }) => (
        <section
          id="espacios"
          className="scroll-mt-24 overflow-hidden rounded-[16px] border border-[var(--color-border-default)] bg-white shadow-[0_12px_28px_-24px_rgba(14,79,144,0.35)]"
        >
          <div className="flex flex-col gap-2.5 px-4 pb-3.5 pt-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-[1.3rem] font-bold tracking-[-0.03em] text-[var(--gray-900)] sm:text-[1.4rem]">
                Espacios
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--gray-500)]">
                Organizaciones que usan Growth OS.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block min-w-[12rem] flex-1 sm:w-52">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-500)]"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar espacios…"
                  className="h-9 w-full rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-background-default)] pl-9 pr-3 text-[13px] text-[var(--gray-900)] outline-none transition focus:border-[var(--growth-os-secondary)] focus:bg-white focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--growth-os-secondary)_16%,transparent)]"
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
                  className="h-9 rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-background-default)] px-2.5 text-[13px] text-[var(--gray-900)] outline-none transition focus:border-[var(--growth-os-secondary)] focus:bg-white"
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
                className="h-9 shrink-0 rounded-[10px] bg-[var(--growth-os-primary)] px-3.5 text-[13px] hover:opacity-95"
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
            <div className="divide-y divide-[var(--color-border-default)] border-t border-[var(--color-border-default)]">
              {filtered.map((space) => (
                <div
                  key={space.tenantId}
                  className="flex min-h-[108px] flex-col gap-3 px-4 py-3 sm:px-5 lg:min-h-[110px] lg:flex-row lg:items-center lg:gap-4"
                >
                  <SpaceThumb space={space} />

                  <div className="min-w-0 flex-[1.05]">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <h3 className="text-[15px] font-bold tracking-[-0.02em] text-[var(--gray-900)] sm:text-[16px]">
                        {space.name}
                      </h3>
                      <span className="text-[12px] font-medium text-[var(--gray-500)]">
                        {space.typeLabel}
                      </span>
                    </div>
                    {space.tagline ? (
                      <p className="mt-1 line-clamp-1 max-w-xl text-[13px] leading-snug text-[var(--gray-700)]">
                        {space.tagline}
                      </p>
                    ) : null}
                  </div>

                  <dl className="grid min-w-0 flex-[1.25] gap-2.5 sm:grid-cols-3 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--gray-100)] text-[var(--growth-os-primary)]">
                        <Building2 className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gray-500)]">
                          Sitio
                        </dt>
                        <dd className="truncate text-[13px] font-medium text-[var(--gray-900)]">
                          {space.primarySite?.name ?? "—"}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--gray-100)] text-[var(--growth-os-primary)]">
                        <Globe2 className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gray-500)]">
                          Dominio principal
                        </dt>
                        <dd className="truncate text-[13px] font-medium text-[var(--gray-900)]">
                          {space.primaryDomain ?? "—"}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--gray-100)] text-[var(--growth-os-primary)]">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gray-500)]">
                          Miembros
                        </dt>
                        <dd className="text-[13px] font-medium tabular-nums text-[var(--gray-900)]">
                          {space.memberCount}
                        </dd>
                      </div>
                    </div>
                  </dl>

                  <div className="flex shrink-0 items-center gap-2 lg:pl-1">
                    <StatusBadge
                      tone={statusTone(space.status)}
                      label={space.statusLabel}
                    />
                    <Link
                      href={`/platform/spaces/${encodeURIComponent(space.tenantId)}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[var(--color-border-default)] bg-white px-3 text-[13px] font-semibold text-[var(--growth-os-primary)] transition hover:border-[color-mix(in_srgb,var(--growth-os-secondary)_45%,var(--border))] hover:bg-[var(--gray-100)]"
                    >
                      Ver espacio
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-[var(--color-border-default)] px-4 py-3 sm:px-5">
            <div
              className={cn(
                "flex flex-col items-start justify-between gap-2.5 rounded-[12px] border border-dashed border-[color-mix(in_srgb,var(--growth-os-secondary)_45%,var(--color-border-default))] bg-[color-mix(in_srgb,var(--growth-os-secondary)_8%,white)] px-3.5 py-3 sm:flex-row sm:items-center sm:px-4"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--growth-os-secondary)_18%,white)] text-[var(--growth-os-primary)]">
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--gray-900)] sm:text-[14px]">
                    ¿Quieres agregar una nueva organización?
                  </p>
                  <p className="mt-0.5 max-w-xl text-[12px] text-[var(--gray-500)] sm:text-[13px]">
                    Crea un nuevo Espacio y actívalo en pocos pasos.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={openCreate}
                className="h-8 shrink-0 rounded-[9px] bg-[var(--growth-os-primary)] px-3 text-[12px] hover:opacity-95"
              >
                Crear Espacio
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
          </div>
        </section>
      )}
    </PlatformCreateSpacePanel>
  );
}
