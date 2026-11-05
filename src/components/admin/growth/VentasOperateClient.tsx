"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Check, UserRound } from "lucide-react";
import { EmptyState, StatusBadge, aek } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  dueInputValue,
  formatRecordedWhen,
  formatStageWhen,
  isCalendarDueOverdue,
} from "@/core/growth/commercial-dates";
import { isGrowthFunnelResultKey } from "@/core/growth/funnel-types";
import {
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_TIMELINE_SECTION_LABEL,
  GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL,
  GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER,
  GROWTH_VENTAS_OPEN_PERSONA_LABEL,
  GROWTH_VENTAS_PAGE_TITLE,
  GROWTH_VENTAS_REGISTER_CONTACT_LABEL,
  GROWTH_VENTAS_SAVE_NOTE_LABEL,
} from "@/lib/growth/labels";
import type { GrowthActivityView } from "@/lib/growth/persona-view";
import type { OpportunityStageStepView } from "@/lib/growth/opportunity-stage-track";
import type { GrowthVentasOpportunityOperateView } from "@/lib/growth/ventas-view";
import { cn } from "@/lib/utils";
import { OwnerSelect } from "./OwnerSelect";

export interface VentasOperateClientProps {
  item: GrowthVentasOpportunityOperateView;
  canOperate: boolean;
  members: Array<{ userId: string; label: string }>;
}

const cardClass = cn(aek.surface, "shadow-[var(--admin-shadow-panel)] px-4 py-4 sm:px-5 sm:py-5");
const RESULT_ORDER = ["won", "lost", "archived", "handed_off"] as const;

function statusTone(status: string): "active" | "inactive" | "info" | "pending" {
  if (status === "won" || status === "handed_off") return "active";
  if (status === "lost" || status === "archived") return "inactive";
  return "info";
}

function priorityTone(
  band: string | null
): "active" | "inactive" | "error" | "pending" {
  if (band === "overdue") return "error";
  if (band === "unfollowed" || band === "stale") return "pending";
  if (band === "current") return "active";
  return "inactive";
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

export function VentasOperateClient({
  item,
  canOperate,
  members,
}: VentasOperateClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [followError, setFollowError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();
  const [statusPickerOpen] = useState(true);
  const [followSummary, setFollowSummary] = useState("");
  const [nextSummary, setNextSummary] = useState("");
  const [nextDue, setNextDue] = useState("");
  const [draftOpportunityId, setDraftOpportunityId] = useState(item.id);
  if (draftOpportunityId !== item.id) {
    setDraftOpportunityId(item.id);
    setFollowSummary("");
    setNextSummary("");
    setNextDue("");
    setRecordError(null);
    setFollowError(null);
    setError(null);
  }

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la acción.");
    }
  };

  const onTransition = (transitionId: string) =>
    run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/transition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transitionId }),
        }
      );
      if (!res.ok) throw new Error(await readError(res));
    });

  const onFollowUp = (kind: "note" | "contact") => {
    if (!followSummary.trim()) {
      setRecordError("Escribe qué ocurrió antes de guardar.");
      return;
    }
    setRecordError(null);
    void run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/activities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, summary: followSummary }),
        }
      );
      if (!res.ok) throw new Error(await readError(res));
      setFollowSummary("");
    });
  };

  const onSetNext = () => {
    if (!nextSummary.trim()) {
      setFollowError("Escribe qué hay que hacer.");
      return;
    }
    setFollowError(null);
    void run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/next-action`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: nextSummary,
            ...(nextDue ? { dueAt: nextDue } : {}),
            ...(item.nextAction?.kind ? { kind: item.nextAction.kind } : {}),
          }),
        }
      );
      if (!res.ok) throw new Error(await readError(res));
      setNextSummary("");
      setNextDue("");
    });
  };

  const onClearNext = () =>
    run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/next-action`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await readError(res));
    });

  const askTransition = (transition: { id: string; toState: string; label: string }) => {
    void (async () => {
      if (isGrowthFunnelResultKey(transition.toState)) {
        const ok = await confirm({
          title: `Marcar como ${transition.label}`,
          description:
            "La oportunidad se cierra. Queda en el historial y se quita la próxima acción.",
          confirmLabel: transition.label,
          destructive: transition.toState === "lost" || transition.toState === "archived",
        });
        if (!ok) return;
      }
      onTransition(transition.id);
    })();
  };

  const typeLine = [item.typeLabel, item.subjectLabel ? item.subjectLabel : null]
    .filter(Boolean)
    .join(" · ");
  const stageMoves = item.availableTransitions.filter(
    (transition) => !isGrowthFunnelResultKey(transition.toState)
  );
  const closures = RESULT_ORDER.flatMap((key) => {
    const transition = item.availableTransitions.find((entry) => entry.toState === key);
    return transition ? [transition] : [];
  });
  const ownerText = item.ownerLabel ?? "Sin responsable";
  const assigneeId = item.nextAction?.assigneeUserId;
  const actionOwner = assigneeId
    ? (members.find((member) => member.userId === assigneeId)?.label ??
      "Responsable sin acceso")
    : ownerText;
  const dueAt = item.nextAction?.dueAt;
  const overdue = Boolean(dueAt && isCalendarDueOverdue(dueAt, new Date()));
  const dueToday = Boolean(dueAt && !overdue && dueInputValue(dueAt) === dueInputValue(new Date().toISOString()));

  return (
    <AdminModulePage
      hideTitle
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: GROWTH_VENTAS_PAGE_TITLE, href: "/admin/ventas" },
        { label: item.personaDisplayName },
      ]}
      title={item.personaDisplayName}
    >
      {dialog}
      <div className="space-y-4" data-oportunidad-ficha>
        {error ? (
          <p className="rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <section className={cardClass} aria-label="Ficha comercial">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className={aek.label}>Contacto</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                    <Link
                      href={`/admin/personas/${encodeURIComponent(item.personaId)}`}
                      className="hover:underline"
                    >
                      {item.personaDisplayName}
                    </Link>
                  </h1>
                  <p className={cn("mt-1 text-sm", item.organizationName ? "text-foreground" : "text-muted")}>
                    {item.organizationName?.trim() || "Sin empresa registrada"}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                    {item.email ? (
                      <a className="text-foreground underline-offset-2 hover:underline" href={`mailto:${item.email}`}>
                        {item.email}
                      </a>
                    ) : (
                      <span className="text-muted">Sin correo</span>
                    )}
                    {item.phone ? (
                      <a className="text-foreground underline-offset-2 hover:underline" href={`tel:${item.phone}`}>
                        {item.phone}
                      </a>
                    ) : (
                      <span className="text-muted">Sin teléfono</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button href="/admin/ventas" variant="outline" size="sm">
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Ventas
                  </Button>
                  <Button
                    href={`/admin/personas/${encodeURIComponent(item.personaId)}?oportunidad=${encodeURIComponent(item.id)}`}
                    variant="outline"
                    size="sm"
                  >
                    <UserRound className="mr-1.5 h-4 w-4" />
                    {GROWTH_VENTAS_OPEN_PERSONA_LABEL}
                  </Button>
                </div>
              </div>
              <div>
                <p className={aek.label}>Oportunidad</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {typeLine || "Sin servicio indicado"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Origen {item.originLabel || "sin registrar"}
                  {" · "}
                  Apertura {item.openedAt ? formatStageWhen(item.openedAt) : "sin fecha"}
                  {isGrowthFunnelResultKey(item.status)
                    ? ` · Cierre ${item.closedAt ? formatStageWhen(item.closedAt) : "sin fecha"}`
                    : ""}
                </p>
              </div>
            </div>
            <dl className="grid w-full gap-3 sm:grid-cols-3 lg:w-[22rem] lg:grid-cols-1">
              <div>
                <dt className="text-xs text-muted">Etapa</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge tone={statusTone(item.status)} label={item.statusLabel} />
                  <span className="text-xs text-muted">{item.funnelName}</span>
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs text-muted">Responsable</dt>
                <dd>
                  <OwnerSelect
                    opportunityId={item.id}
                    ownerUserId={item.ownerUserId}
                    members={members}
                    disabled={!canOperate}
                    showLabel={false}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Prioridad</dt>
                <dd className="mt-1">
                  <StatusBadge tone={priorityTone(item.priorityBand)} label={item.priorityLabel} />
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <StageTrack track={item.stageTrack} />

        <section
          className={cn(
            cardClass,
            overdue
              ? "border-[color-mix(in_srgb,var(--color-danger)_40%,var(--admin-border-subtle))] bg-[color-mix(in_srgb,var(--color-danger)_7%,var(--admin-surface))]"
              : "border-[color-mix(in_srgb,var(--color-primary)_28%,var(--admin-border-subtle))] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--admin-surface))]"
          )}
          aria-label={GROWTH_NEXT_ACTION_SECTION_LABEL}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={aek.label}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
            {overdue ? <StatusBadge tone="error" label="Vencida" /> : null}
            {dueToday ? <StatusBadge tone="pending" label="Vence hoy" /> : null}
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {item.nextAction?.summary ?? GROWTH_NO_NEXT_ACTION_LABEL}
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">Responsable</dt>
              <dd className="text-sm font-medium text-foreground">{actionOwner}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Vencimiento</dt>
              <dd className={cn("text-sm font-medium", overdue ? "text-destructive" : "text-foreground")}>
                {dueAt ? formatStageWhen(dueAt) : "Sin vencimiento"}
              </dd>
            </div>
          </dl>
          {canOperate ? (
            <div className="mt-4 space-y-3 border-t border-[var(--admin-border-subtle)] pt-4">
              <p className="text-sm font-medium text-foreground">Programar seguimiento</p>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11.5rem] sm:items-end">
                <Input
                  aria-label="Programar seguimiento"
                  value={nextSummary}
                  onChange={(event) => setNextSummary(event.target.value)}
                  placeholder="Ej. Llamar para confirmar interés"
                />
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">Vencimiento</span>
                  <Input
                    type="date"
                    aria-label="Fecha del seguimiento"
                    value={nextDue}
                    onChange={(event) => setNextDue(event.target.value)}
                  />
                </label>
              </div>
              {followError ? <p className="text-sm text-destructive">{followError}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" disabled={pending} onClick={onSetNext}>
                  Guardar seguimiento
                </Button>
                {item.nextAction ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={onClearNext}
                  >
                    {GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        {canOperate ? (
          <section className={cardClass} aria-label="Acciones comerciales">
            <p className={aek.label}>Acciones</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Registrar contacto y agregar nota
                </p>
                <Textarea
                  aria-label="Contacto o nota"
                  value={followSummary}
                  onChange={(event) => setFollowSummary(event.target.value)}
                  placeholder={GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER}
                  rows={2}
                />
                {recordError ? <p className="text-sm text-destructive">{recordError}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" disabled={pending} onClick={() => onFollowUp("contact")}>
                    {GROWTH_VENTAS_REGISTER_CONTACT_LABEL}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => onFollowUp("note")}
                  >
                    {GROWTH_VENTAS_SAVE_NOTE_LABEL}
                  </Button>
                </div>
              </div>
              {statusPickerOpen ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Cambiar etapa</p>
                    {item.availableTransitions.length === 0 ? (
                      <div className="mt-2">
                        <EmptyState
                          title="Sin cambios disponibles"
                          description="Esta situación no admite más cambios desde Ventas."
                        />
                      </div>
                    ) : stageMoves.length === 0 ? (
                      <p className="mt-2 text-sm text-muted">No hay otra etapa activa.</p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {stageMoves.map((t) => (
                          <Button
                            key={t.id}
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={pending}
                            onClick={() => askTransition(t)}
                          >
                            {t.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  {item.availableTransitions.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-foreground">Cerrar</p>
                      {closures.length === 0 ? (
                        <p className="mt-2 text-sm text-muted">No hay un cierre disponible.</p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {closures.map((t) => (
                            <Button
                              key={t.id}
                              type="button"
                              size="sm"
                              variant={
                                t.toState === "won"
                                  ? "primary"
                                  : t.toState === "lost" || t.toState === "archived"
                                    ? "danger"
                                    : "outline"
                              }
                              disabled={pending}
                              onClick={() => askTransition(t)}
                            >
                              {t.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        ) : (
          <p className="text-sm text-muted">
            Solo lectura: no tienes permiso para operar Oportunidades.
          </p>
        )}

        <FunnelDataFields key={item.id} item={item} canOperate={canOperate} />
        {item.assessment ? (
          <section className={cardClass}>
            <p className={aek.label}>{item.assessment.title}</p>
            <p className="mt-1 text-sm text-foreground">{item.assessment.headline}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{item.assessment.disclaimer}</p>
            <ul className="mt-4 space-y-2">
              {item.assessment.items.map((entry) => (
                <li key={entry.id} className="text-sm">
                  <span className="font-medium text-foreground">{entry.label}</span>
                  <span className="text-muted"> · {entry.statusLabel}</span>
                  {entry.detail ? (
                    <span className="mt-0.5 block text-muted">{entry.detail}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            {item.assessment.previousCount > 0 ? (
              <p className="mt-3 text-sm text-muted">
                {item.assessment.previousCount === 1
                  ? "Hay 1 diagnóstico anterior en el historial."
                  : `Hay ${item.assessment.previousCount} diagnósticos anteriores en el historial.`}
              </p>
            ) : null}
            {item.assessment.reportPath ? (
              <a
                href={item.assessment.reportPath}
                className="mt-4 inline-block text-sm font-semibold text-foreground underline"
              >
                Ver informe
              </a>
            ) : null}
          </section>
        ) : null}

        <section className={cardClass} aria-label="Historial">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
            <div className="min-w-0">
              <p className={aek.label}>{GROWTH_TIMELINE_SECTION_LABEL}</p>
              <p className="mb-3 mt-1 text-xs text-muted">Del más reciente al más antiguo.</p>
              <ActivityList
                activities={item.recentActivities}
                empty="Sin hechos registrados aún."
              />
            </div>
            <div className="min-w-0 border-t border-[var(--admin-border-subtle)] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className={aek.label}>Conversaciones</p>
              {item.conversations.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Sin conversaciones.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {item.conversations.map((conversation) => (
                    <li
                      key={conversation.id}
                      className="border-b border-[var(--admin-border-subtle)] pb-3 last:border-b-0 last:pb-0"
                    >
                      <Link
                        href={`/admin/mensajes?c=${encodeURIComponent(conversation.id)}`}
                        className="text-sm font-semibold text-foreground underline-offset-2 hover:underline"
                      >
                        {conversation.channelLabel}
                        {conversation.statusLabel ? ` · ${conversation.statusLabel}` : ""}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted">
                        {conversation.lastMessagePreview || "Sin mensaje."}
                      </p>
                      <p className="text-xs text-muted">{conversation.timeLabel}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminModulePage>
  );
}

function StageTrack({
  track,
}: {
  track: GrowthVentasOpportunityOperateView["stageTrack"];
}) {
  return (
    <section className={cardClass} aria-label="Etapas del embudo">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={aek.label}>Recorrido</p>
        {track.resultLabel ? (
          <p className="text-sm font-semibold text-foreground">Cerrada como {track.resultLabel}</p>
        ) : null}
      </div>
      {track.steps.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Este embudo no tiene etapas configuradas.</p>
      ) : (
        <ol className="mt-3 flex snap-x items-stretch gap-1 overflow-x-auto pb-1">
          {track.steps.map((step, index) => (
            <StageCard
              key={step.key}
              step={step}
              index={index}
              connected={index < track.steps.length - 1}
            />
          ))}
        </ol>
      )}
      {track.notes.length > 0 ? (
        <p className="mt-2 text-xs leading-5 text-muted">{track.notes.join(" ")}</p>
      ) : null}
    </section>
  );
}

function StageCard({
  step,
  index,
  connected,
}: {
  step: OpportunityStageStepView;
  index: number;
  connected: boolean;
}) {
  const visited = step.mark === "visited";
  const current = step.mark === "current";
  const inactive = step.caption === "Inactiva";
  return (
    <li className="flex min-w-[10.75rem] flex-1 snap-start items-stretch" aria-current={current ? "step" : undefined}>
      <div
        className={cn(
          "flex min-w-[9.25rem] flex-1 flex-col rounded-xl border px-3 py-2.5",
          visited &&
            "border-[color-mix(in_srgb,var(--color-success)_45%,var(--admin-border-subtle))] bg-[color-mix(in_srgb,var(--color-success)_10%,var(--admin-surface))]",
          current &&
            "border-[color-mix(in_srgb,var(--color-primary)_55%,var(--admin-border-subtle))] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--admin-surface))] shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
          step.mark === "pending" &&
            "border-[var(--admin-border-subtle)] bg-[var(--admin-surface-muted)]",
          inactive && "border-dashed"
        )}
      >
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
              visited && "bg-[var(--color-success)] text-white",
              current && "bg-[var(--color-primary)] text-white",
              !visited && !current && "border border-[var(--admin-border-subtle)] text-muted"
            )}
            aria-hidden
          >
            {visited ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : index + 1}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {step.caption}
          </span>
        </span>
        <span
          className={cn(
            "mt-2 text-sm font-semibold leading-tight",
            step.mark === "pending" ? "text-muted" : "text-foreground"
          )}
        >
          {step.label}
        </span>
        {step.occurredAt ? (
          <span className="mt-1 text-xs text-foreground">{formatStageWhen(step.occurredAt)}</span>
        ) : step.mark !== "pending" ? (
          <span className="mt-1 text-xs text-muted">Sin fecha en el historial</span>
        ) : null}
      </div>
      {connected ? (
        <span
          className="mx-1 w-3 shrink-0 self-center border-t-2 border-[var(--admin-border-subtle)]"
          aria-hidden
        />
      ) : null}
    </li>
  );
}

function ActivityList({
  activities,
  empty,
}: {
  activities: GrowthActivityView[];
  empty: string;
}) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }
  return (
    <ol className="space-y-3">
      {activities.map((activity) => {
        const same = activity.kindLabel === activity.summary;
        const notable = activity.kind === "note" || activity.kind === "contact";
        return (
          <li
            key={activity.id}
            className={cn(
              "border-b border-[var(--admin-border-subtle)] pb-3 last:border-b-0 last:pb-0",
              notable && "border-l-2 border-l-[var(--color-primary)] pl-3"
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className={cn("text-sm text-foreground", notable ? "font-semibold" : "font-medium")}>
                {notable ? (
                  <span className="mr-2 inline-flex rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                    {activity.kindLabel}
                  </span>
                ) : null}
                {same ? (notable ? null : activity.kindLabel) : activity.summary}
              </p>
              <time className="text-xs text-muted">
                {activity.occurredAt ? formatRecordedWhen(activity.occurredAt) : "Sin fecha"}
              </time>
            </div>
            {same || notable ? null : (
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted">
                {activity.kindLabel}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function FunnelDataFields({
  item,
  canOperate,
}: {
  item: GrowthVentasOpportunityOperateView;
  canOperate: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {};
    for (const field of item.funnelFields) {
      if (field.type === "boolean") initial[field.key] = field.value === true;
      else initial[field.key] = field.value == null ? "" : String(field.value);
    }
    return initial;
  });
  const [notice, setNotice] = useState<string | null>(null);
  if (item.funnelFields.length === 0) return null;
  return (
    <section className={cardClass}>
      <p className={aek.label}>Datos del embudo</p>
      <div className="mt-3 space-y-3">
        {item.funnelFields.map((field) => (
          <label key={field.key} className="block text-sm">
            <span className="font-medium text-foreground">
              {field.label}
              {field.required ? " · obligatorio" : ""}
              {field.incomplete ? " · incompleto" : ""}
              {field.readOnly ? " · inactivo" : ""}
            </span>
            {field.help ? <span className="mt-0.5 block text-muted">{field.help}</span> : null}
            {field.type === "boolean" ? (
              <input
                type="checkbox"
                className="mt-2"
                checked={values[field.key] === true}
                disabled={!canOperate || field.readOnly}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.key]: event.target.checked }))
                }
              />
            ) : field.type === "select" ? (
              <select
                className="mt-1 w-full rounded-[var(--radius-md)] border px-2 py-1.5 disabled:cursor-not-allowed disabled:bg-[var(--admin-surface-muted)]"
                value={String(values[field.key] ?? "")}
                disabled={!canOperate || field.readOnly}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.key]: event.target.value }))
                }
              >
                <option value="">Sin valor</option>
                {field.options.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === "long_text" ? (
              <Textarea
                className="mt-1"
                value={String(values[field.key] ?? "")}
                disabled={!canOperate || field.readOnly}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.key]: event.target.value }))
                }
              />
            ) : (
              <Input
                className="mt-1"
                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                value={String(values[field.key] ?? "")}
                disabled={!canOperate || field.readOnly}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.key]: event.target.value }))
                }
              />
            )}
          </label>
        ))}
      </div>
      {canOperate ? (
        <Button
          type="button"
          size="sm"
          className="mt-3"
          onClick={() => {
            const payload: Record<string, unknown> = {};
            for (const field of item.funnelFields) {
              if (field.readOnly) continue;
              const raw = values[field.key];
              if (field.type === "boolean") payload[field.key] = raw === true;
              else if (field.type === "number") payload[field.key] = raw === "" ? null : Number(raw);
              else payload[field.key] = raw === "" ? null : raw;
            }
            void (async () => {
              const response = await fetch(
                `/api/growth/oportunidades/${encodeURIComponent(item.id)}/fields`,
                {
                  method: "PUT",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ values: payload }),
                }
              );
              const data = (await response.json()) as { error?: string; incomplete?: string[] };
              if (!response.ok) setNotice(data.error ?? "No se pudieron guardar los datos.");
              else {
                setNotice(
                  data.incomplete && data.incomplete.length > 0
                    ? "Guardado. Hay campos obligatorios incompletos; igual puedes cambiar de etapa."
                    : "Datos guardados."
                );
                router.refresh();
              }
            })();
          }}
        >
          Guardar datos
        </Button>
      ) : null}
      {notice ? <p className="mt-2 text-sm text-muted">{notice}</p> : null}
    </section>
  );
}
