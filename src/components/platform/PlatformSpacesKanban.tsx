"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge, type StatusBadgeTone } from "@/components/admin/kit";
import { PlatformSpaceActionsMenu } from "@/components/platform/PlatformSpaceActionsMenu";
import { SpaceTypeFallbackMark } from "@/components/platform/SpaceTypeFallbackMark";
import { spaceTypeVisual } from "@/lib/platform/space-type-visual";
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
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

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

function columnsFor(spaces: PlatformSpaceListItem[]) {
  const order: string[] = [];
  const groups = new Map<string, PlatformSpaceListItem[]>();
  for (const space of spaces) {
    const key = space.typeLabel.trim() || "Otro";
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(space);
    } else {
      order.push(key);
      groups.set(key, [space]);
    }
  }
  return order.map((label) => ({
    label,
    type: groups.get(label)![0].type,
    spaces: groups.get(label)!,
  }));
}

export function PlatformSpacesKanban({
  spaces,
}: {
  spaces: PlatformSpaceListItem[];
}) {
  const columns = columnsFor(spaces);

  return (
    <div
      className="grid gap-3 px-4 py-4 sm:px-5"
      style={{
        gridTemplateColumns:
          "repeat(auto-fit, minmax(min(100%, max(17.5rem, calc((100% - 3rem) / 4))), 1fr))",
      }}
      role="region"
      aria-label="Espacios por tipo"
    >
      {columns.map((column) => {
        const visual = spaceTypeVisual(column.type);
        const Icon = visual.icon;
        return (
          <section
            key={column.label}
            aria-label={column.label}
            className="flex min-w-0 flex-col rounded-xl bg-[color-mix(in_srgb,var(--gray-100)_80%,white)]"
          >
            <header className="flex items-center gap-2 px-3 pb-1 pt-3">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  visual.badgeBg,
                  visual.iconFg
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden />
              </span>
              <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--gray-900)]">
                {column.label}
              </h3>
              <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--gray-500)]">
                {column.spaces.length}
              </span>
            </header>
            <div className="flex flex-col gap-2 p-2">
              {column.spaces.map((space) => (
                <article
                  key={space.tenantId}
                  className="rounded-xl border border-[var(--color-border-default)] bg-white p-3 shadow-[0_8px_20px_-18px_rgba(14,79,144,0.55)]"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <SpaceThumb space={space} />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[14px] font-semibold tracking-[-0.02em] text-[var(--gray-900)]">
                        {space.name}
                      </h4>
                      {space.tagline ? (
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--gray-500)]">
                          {space.tagline}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <dl className="mt-3 space-y-1.5">
                    <div className="min-w-0">
                      <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--gray-400)]">
                        Sitio
                      </dt>
                      <dd className="truncate text-[13px] text-[var(--gray-800)]">
                        {space.primarySite?.name ?? "—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--gray-400)]">
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
                  </dl>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-[12px] text-[var(--gray-500)]">
                      <span className="font-medium tabular-nums text-[var(--gray-800)]">
                        {space.memberCount}
                      </span>{" "}
                      {space.memberCount === 1 ? "miembro" : "miembros"}
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
                  <div className="mt-3 flex items-center gap-1.5">
                    <Link
                      href={`/platform/spaces/${encodeURIComponent(space.tenantId)}`}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--color-border-default)] bg-white px-2.5 text-[12px] font-semibold text-[var(--growth-os-primary)] transition hover:border-[color-mix(in_srgb,var(--growth-os-secondary)_45%,var(--border))] hover:bg-[var(--gray-100)]"
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
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
