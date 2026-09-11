"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, CircleDot } from "lucide-react";
import {
  EmptyState,
  Section,
  StatusBadge,
  Timeline,
  aek,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import {
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_ORIGIN_SECTION_LABEL,
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_RELATED_HISTORY_LABEL,
  GROWTH_TIMELINE_SECTION_LABEL,
  GROWTH_VIEW_DETAIL_LABEL,
} from "@/lib/growth/labels";
import type {
  GrowthNextActionView,
  GrowthOportunidadView,
  GrowthPersonaDetailView,
} from "@/lib/growth/persona-view";
import { cn } from "@/lib/utils";

export interface PersonaDetailClientProps {
  persona: GrowthPersonaDetailView;
  focusOportunidadId?: string;
}

function formatWhen(iso?: string): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function personaInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

const detailCardClass = cn(
  aek.surface,
  "shadow-[var(--admin-shadow-panel)]"
);

function NextActionBlock({ action }: { action: GrowthNextActionView | null }) {
  if (!action) {
    return (
      <div className={cn(detailCardClass, "px-5 py-5")}>
        <p className={aek.label}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
        <p className="mt-2 text-sm font-medium text-muted">
          {GROWTH_NO_NEXT_ACTION_LABEL}
        </p>
      </div>
    );
  }

  const due = formatWhen(action.dueAt);

  return (
    <div
      className={cn(
        detailCardClass,
        "border-primary/25 bg-[color-mix(in_srgb,var(--color-primary)_4%,white)] px-5 py-5"
      )}
    >
      <p className={aek.label}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
      <p className="mt-2 text-base font-semibold tracking-tight text-foreground">
        {action.summary}
      </p>
      <p className="mt-1.5 text-sm text-muted">
        {action.kindLabel}
        {action.oportunidadTypeLabel ? ` · ${action.oportunidadTypeLabel}` : ""}
        {due ? ` · Para ${due}` : ""}
      </p>
      <Link
        href={`?oportunidad=${encodeURIComponent(action.oportunidadId)}#oportunidad-${action.oportunidadId}`}
        className="mt-3.5 inline-flex text-xs font-semibold text-primary hover:underline"
      >
        {GROWTH_VIEW_DETAIL_LABEL} de la Oportunidad
      </Link>
    </div>
  );
}

function opportunityStatusTone(
  status: string
): "active" | "inactive" | "info" {
  if (status === "won" || status === "handed_off") return "active";
  if (status === "lost" || status === "archived") return "inactive";
  return "info";
}

function OportunidadCard({
  op,
  personaName,
  focused,
  isPrimaryAction,
}: {
  op: GrowthOportunidadView;
  personaName: string;
  focused: boolean;
  isPrimaryAction: boolean;
}) {
  const showOwnNextAction = !isPrimaryAction && (focused || Boolean(op.nextAction));

  return (
    <li
      id={`oportunidad-${op.id}`}
      className={cn(
        detailCardClass,
        "scroll-mt-24 px-5 py-5",
        focused && "ring-2 ring-primary/35"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight text-foreground">
            {op.typeLabel}
            {op.subjectLabel ? ` · ${op.subjectLabel}` : ""}
          </p>
          {focused ? (
            <p className="mt-1.5 text-xs text-muted">Persona: {personaName}</p>
          ) : null}
          <p className={cn("text-xs text-muted", focused ? "mt-1" : "mt-1.5")}>
            {focused ? `${GROWTH_ORIGIN_SECTION_LABEL}: ` : null}
            {op.originLabel}
          </p>
        </div>
        <StatusBadge tone={opportunityStatusTone(op.status)} label={op.statusLabel} />
      </div>

      {showOwnNextAction ? (
        <p className="mt-3 text-sm text-muted">
          {op.nextAction ? (
            <>
              <span className="font-medium text-foreground">{op.nextAction.summary}</span>
              {op.nextAction.dueAt ? ` · ${formatWhen(op.nextAction.dueAt)}` : ""}
            </>
          ) : (
            GROWTH_NO_NEXT_ACTION_LABEL
          )}
        </p>
      ) : null}

      {focused ? (
        <div className="mt-4 border-t border-[var(--admin-border-subtle)] pt-3.5">
          <p className={aek.label}>{GROWTH_RELATED_HISTORY_LABEL}</p>
          {op.relatedActivities.length === 0 ? (
            <p className="mt-1.5 text-sm text-muted">
              Todavía no hay hechos ligados a esta Oportunidad.
            </p>
          ) : (
            <ul className="mt-2.5 space-y-2">
              {op.relatedActivities.map((act) => {
                const kindDiffers = act.kindLabel !== act.summary;
                return (
                  <li key={act.id} className="text-sm text-foreground">
                    <span className="font-medium">{act.summary}</span>
                    <span className="text-muted">
                      {kindDiffers ? ` · ${act.kindLabel}` : ""} ·{" "}
                      {formatRelativeTime(act.occurredAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <Link
          href={`?oportunidad=${encodeURIComponent(op.id)}#oportunidad-${op.id}`}
          className="mt-3.5 inline-flex text-xs font-semibold text-primary hover:underline"
        >
          {GROWTH_VIEW_DETAIL_LABEL}
        </Link>
      )}
    </li>
  );
}

export function PersonaDetailClient({
  persona,
  focusOportunidadId,
}: PersonaDetailClientProps) {
  useEffect(() => {
    if (!focusOportunidadId) return;
    const el = document.getElementById(`oportunidad-${focusOportunidadId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusOportunidadId]);

  const timelineItems = persona.activities.map((a) => ({
    id: a.id,
    title: a.summary,
    description: a.kindLabel === a.summary ? undefined : a.kindLabel,
    time: formatRelativeTime(a.occurredAt),
  }));

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Personas", href: "/admin/personas" },
        { label: persona.displayName },
      ]}
      title={persona.displayName}
      description="Quién es, qué quiere y qué ha pasado."
      actions={
        <Button href="/admin/personas" variant="outline" size="sm">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Personas
        </Button>
      }
    >
      <div className={aek.sectionGap}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className={cn(detailCardClass, "px-5 py-5")}>
            <div className="flex items-start gap-3.5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] text-sm font-bold tracking-tight text-[var(--color-primary)]"
                aria-hidden
              >
                {personaInitial(persona.displayName)}
              </span>
              <div className="min-w-0">
                <p className={aek.label}>Persona</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                  {persona.displayName}
                </p>
              </div>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-[var(--admin-border-subtle)] pt-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Correo</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {persona.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Teléfono</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {persona.phone ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted">{GROWTH_ORIGIN_SECTION_LABEL}</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {persona.originLabel}
                  {persona.originCapturedAt
                    ? ` · ${formatWhen(persona.originCapturedAt) ?? ""}`
                    : ""}
                </dd>
              </div>
            </dl>
          </div>

          <NextActionBlock action={persona.primaryNextAction} />
        </div>

        <Section title="Oportunidades" description="Qué quiere esta Persona.">
          {persona.oportunidades.length === 0 ? (
            <EmptyState
              title="Sin Oportunidades"
              description="Todavía no hay una intención registrada para esta Persona."
              icon={<CircleDot className="h-7 w-7" />}
              className="bg-[var(--admin-surface)] shadow-[var(--admin-shadow-panel)]"
            />
          ) : (
            <ul className="space-y-3">
              {persona.oportunidades.map((op) => (
                <OportunidadCard
                  key={op.id}
                  op={op}
                  personaName={persona.displayName}
                  focused={focusOportunidadId === op.id}
                  isPrimaryAction={
                    persona.primaryNextAction?.oportunidadId === op.id
                  }
                />
              ))}
            </ul>
          )}
        </Section>

        <Section
          title={GROWTH_TIMELINE_SECTION_LABEL}
          description="Hechos recientes, del más nuevo al más antiguo."
        >
          {timelineItems.length === 0 ? (
            <EmptyState
              title="Todavía no hay hechos"
              description="Cuando haya actividad relacionada, se verá aquí."
              className="bg-[var(--admin-surface)] shadow-[var(--admin-shadow-panel)]"
            />
          ) : (
            <div className={cn(detailCardClass, "px-5 py-5")}>
              <Timeline items={timelineItems} />
            </div>
          )}
        </Section>
      </div>
    </AdminModulePage>
  );
}
