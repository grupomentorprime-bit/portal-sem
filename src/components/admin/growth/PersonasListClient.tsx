"use client";

import Link from "next/link";
import { useCallback, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, UserRound } from "lucide-react";
import {
  EmptyState,
  FilterBar,
  FilterSelect,
  aek,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_OPPORTUNITY_STATUS_FILTER_OPTIONS,
  GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS,
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_PERSONAS_CREATE_CTA,
  GROWTH_PERSONAS_CREATE_DESCRIPTION,
  GROWTH_PERSONAS_CREATE_TITLE,
  GROWTH_PERSONAS_EMPTY_DESCRIPTION,
  GROWTH_PERSONAS_EMPTY_TITLE,
  GROWTH_PERSONAS_LIMIT_NOTE,
  GROWTH_PERSONAS_NO_MATCH_DESCRIPTION,
  GROWTH_PERSONAS_NO_MATCH_TITLE,
  GROWTH_PERSONAS_PAGE_DESCRIPTION,
  GROWTH_PERSONAS_PAGE_TITLE,
  GROWTH_PERSONA_ORIGIN_FILTER_OPTIONS,
  GROWTH_VIEW_PERSONA_LABEL,
} from "@/lib/growth/labels";
import type { GrowthPersonaListItemView } from "@/lib/growth/persona-view";
import { cn } from "@/lib/utils";

export interface PersonasListClientProps {
  items: GrowthPersonaListItemView[];
  q: string;
  opportunityType: string;
  opportunityStatus: string;
  origin: string;
  canManage: boolean;
  listLimit?: number;
}

function personaInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function opportunityCountLabel(count: number): string | null {
  if (count <= 0) return null;
  return count === 1 ? "1 oportunidad" : `${count} oportunidades`;
}

const personaRowClass = cn(
  aek.surface,
  "shadow-[var(--admin-shadow-panel)] transition duration-150",
  "hover:border-[color-mix(in_srgb,var(--color-primary)_18%,var(--admin-border-subtle))]"
);

export function PersonasListClient({
  items,
  q,
  opportunityType,
  opportunityStatus,
  origin,
  canManage,
  listLimit = 100,
}: PersonasListClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createInfo, setCreateInfo] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const pushFilters = useCallback(
    (next: {
      q?: string;
      type?: string;
      status?: string;
      origin?: string;
    }) => {
      const params = new URLSearchParams();
      const nextQ = next.q ?? q;
      const nextType = next.type ?? opportunityType;
      const nextStatus = next.status ?? opportunityStatus;
      const nextOrigin = next.origin ?? origin;
      if (nextQ.trim()) params.set("q", nextQ.trim());
      if (nextType) params.set("type", nextType);
      if (nextStatus) params.set("status", nextStatus);
      if (nextOrigin) params.set("origin", nextOrigin);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/admin/personas?${qs}` : "/admin/personas");
      });
    },
    [opportunityStatus, opportunityType, origin, q, router]
  );

  const hasFilters = Boolean(q || opportunityType || opportunityStatus || origin);
  const isEmpty = items.length === 0;
  const isTrueEmpty = isEmpty && !hasFilters;
  const hitLimit = items.length >= listLimit;
  const emptyTitle = hasFilters
    ? GROWTH_PERSONAS_NO_MATCH_TITLE
    : GROWTH_PERSONAS_EMPTY_TITLE;
  const emptyDescription = hasFilters
    ? GROWTH_PERSONAS_NO_MATCH_DESCRIPTION
    : GROWTH_PERSONAS_EMPTY_DESCRIPTION;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateInfo(null);
    setCreating(true);
    try {
      const res = await fetch("/api/growth/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, phone }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        outcome?: string;
        personaId?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setCreateError(data.error ?? "No pudimos crear la persona.");
        return;
      }
      setCreateInfo(data.message ?? null);
      setCreateOpen(false);
      setDisplayName("");
      setEmail("");
      setPhone("");
      if (data.personaId) {
        startTransition(() => {
          router.push(`/admin/personas/${encodeURIComponent(data.personaId!)}`);
        });
      } else {
        startTransition(() => router.refresh());
      }
    } catch {
      setCreateError("No pudimos crear la persona. Inténtalo de nuevo.");
    } finally {
      setCreating(false);
    }
  }

  const filterBar = (
    <div className="space-y-3" data-personas-filters>
      <FilterBar
        className={cn(
          isTrueEmpty &&
            "rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-3 py-2.5 shadow-[var(--admin-shadow-card)] opacity-90"
        )}
        search={{
          placeholder: "Buscar por nombre, correo o teléfono",
          value: q,
          onChange: (value) => pushFilters({ q: value }),
        }}
        onReset={
          hasFilters
            ? () => {
                startTransition(() => router.push("/admin/personas"));
              }
            : undefined
        }
      />
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 sm:flex-wrap sm:overflow-visible">
        <FilterSelect
          aria-label="Filtrar por origen"
          className="w-[148px] shrink-0 sm:w-[160px]"
          value={origin}
          onChange={(e) => pushFilters({ origin: e.target.value })}
          options={[...GROWTH_PERSONA_ORIGIN_FILTER_OPTIONS]}
        />
        <FilterSelect
          aria-label="Filtrar por tipo de oportunidad"
          className="w-[148px] shrink-0 sm:w-[168px]"
          value={opportunityType}
          onChange={(e) => pushFilters({ type: e.target.value })}
          options={[
            { value: "", label: "Oportunidades" },
            ...GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS,
          ]}
        />
        <FilterSelect
          aria-label="Filtrar por estado"
          className="w-[120px] shrink-0 sm:w-[140px]"
          value={opportunityStatus}
          onChange={(e) => pushFilters({ status: e.target.value })}
          options={[
            { value: "", label: "Estados" },
            ...GROWTH_OPPORTUNITY_STATUS_FILTER_OPTIONS,
          ]}
        />
      </div>
    </div>
  );

  const emptyBlock = (
    <div
      data-personas-empty={isTrueEmpty ? "true" : undefined}
      data-personas-no-match={hasFilters && isEmpty ? "true" : undefined}
    >
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={<UserRound className="h-8 w-8" strokeWidth={1.5} />}
        className={cn(
          "border-[var(--admin-border-subtle)] bg-[var(--admin-surface)]",
          isTrueEmpty ? "px-8 py-14 sm:py-16" : "px-6 py-12"
        )}
        action={
          isTrueEmpty && canManage
            ? {
                label: GROWTH_PERSONAS_CREATE_CTA,
                onClick: () => setCreateOpen(true),
              }
            : hasFilters
              ? {
                  label: "Limpiar filtros",
                  onClick: () => {
                    startTransition(() => router.push("/admin/personas"));
                  },
                }
              : undefined
        }
      />
    </div>
  );

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: GROWTH_PERSONAS_PAGE_TITLE },
      ]}
      title={GROWTH_PERSONAS_PAGE_TITLE}
      description={GROWTH_PERSONAS_PAGE_DESCRIPTION}
      actions={
        canManage ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            {GROWTH_PERSONAS_CREATE_CTA}
          </Button>
        ) : null
      }
    >
      <div
        className={cn(aek.sectionGap, pending && "opacity-70")}
        data-personas-list={!isEmpty ? "true" : undefined}
      >
        {createInfo ? (
          <p className="text-sm text-muted" role="status">
            {createInfo}
          </p>
        ) : null}
        {isTrueEmpty ? (
          <>
            {emptyBlock}
            {filterBar}
          </>
        ) : (
          <>
            {filterBar}
            {isEmpty ? (
              emptyBlock
            ) : (
              <>
                <ul className="space-y-2.5">
                  {items.map((item) => {
                    const hasPending =
                      item.nextActionLabel !== GROWTH_NO_NEXT_ACTION_LABEL;
                    const oppLabel = opportunityCountLabel(item.opportunityCount);
                    return (
                      <li key={item.id}>
                        <Link
                          href={`/admin/personas/${encodeURIComponent(item.id)}`}
                          className={cn(
                            personaRowClass,
                            "grid gap-3 px-4 py-3.5 no-underline sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(11rem,0.95fr)] sm:items-center sm:gap-5"
                          )}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <span
                              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[color-mix(in_srgb,var(--color-primary)_9%,white)] text-xs font-semibold tracking-tight text-[var(--color-primary)]"
                              aria-hidden
                            >
                              {personaInitial(item.displayName)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                                {item.displayName}
                              </p>
                              <p className="mt-0.5 truncate text-sm text-muted">
                                {[item.email, item.phone]
                                  .filter(Boolean)
                                  .join(" · ") || "Sin correo ni teléfono"}
                              </p>
                            </div>
                          </div>

                          <div className="min-w-0 space-y-0.5 pl-12 sm:pl-0">
                            <p className="text-sm font-medium text-foreground">
                              {item.originLabel}
                            </p>
                            {oppLabel ? (
                              <p className="text-sm text-muted">{oppLabel}</p>
                            ) : null}
                          </div>

                          <div className="flex min-w-0 items-end justify-between gap-3 pl-12 sm:flex-col sm:items-end sm:pl-0 sm:text-right">
                            <div className="min-w-0">
                              <p className={aek.label}>
                                {GROWTH_NEXT_ACTION_SECTION_LABEL}
                              </p>
                              <p
                                className={cn(
                                  "mt-1 text-sm",
                                  hasPending
                                    ? "font-semibold text-foreground"
                                    : "text-muted"
                                )}
                              >
                                {item.nextActionLabel}
                              </p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary">
                              {GROWTH_VIEW_PERSONA_LABEL}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {hitLimit ? (
                  <p className="text-xs text-muted">{GROWTH_PERSONAS_LIMIT_NOTE}</p>
                ) : null}
              </>
            )}
          </>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => {
          if (!creating) {
            setCreateOpen(false);
            setCreateError(null);
          }
        }}
        title={GROWTH_PERSONAS_CREATE_TITLE}
        description={GROWTH_PERSONAS_CREATE_DESCRIPTION}
        size="sm"
      >
        <form
          className="space-y-4"
          onSubmit={handleCreate}
          data-persona-create-modal
        >
          <Input
            label="Nombre"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoFocus
            disabled={creating}
          />
          <Input
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={creating}
          />
          <Input
            label="Teléfono"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={creating}
          />
          {createError ? (
            <p className="text-sm text-primary" role="alert">
              {createError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={creating}
              onClick={() => {
                setCreateOpen(false);
                setCreateError(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={creating} loading={creating}>
              {GROWTH_PERSONAS_CREATE_CTA}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminModulePage>
  );
}
