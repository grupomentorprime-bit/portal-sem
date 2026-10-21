"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Check, UserRound } from "lucide-react";
import {
  EmptyState,
  Section,
  StatusBadge,
  Timeline,
  aek,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import {
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_TIMELINE_SECTION_LABEL,
  GROWTH_VENTAS_CHANGE_STATUS_LABEL,
  GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL,
  GROWTH_VENTAS_CURRENT_STATUS_LABEL,
  GROWTH_VENTAS_FOLLOW_UP_LABEL,
  GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER,
  GROWTH_VENTAS_OPEN_PERSONA_LABEL,
  GROWTH_VENTAS_PAGE_TITLE,
  GROWTH_VENTAS_REGISTER_CONTACT_LABEL,
  GROWTH_VENTAS_SAVE_NOTE_LABEL,
} from "@/lib/growth/labels";
import { isGrowthFunnelResultKey } from "@/core/growth/funnel-types";
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

const cardClass = cn(aek.surface, "shadow-[var(--admin-shadow-panel)] px-5 py-5");
const RESULT_ORDER = ["won", "lost", "archived", "handed_off"] as const;

function statusTone(status: string): "active" | "inactive" | "info" | "pending" {
  if (status === "won" || status === "handed_off") return "active";
  if (status === "lost" || status === "archived") return "inactive";
  return "info";
}

function formatWhen(iso?: string): string {
  if (!iso) return "";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (dateOnly) {
    const date = new Date(
      Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    );
    return date.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  return new Date(parsed).toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function dueInputValue(dueAt?: string): string {
  if (!dueAt) return "";
  const match = dueAt.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
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
  const { confirm, dialog } = useConfirmDialog();
  const [statusPickerOpen, setStatusPickerOpen] = useState(true);
  const [followSummary, setFollowSummary] = useState("");
  const [nextSummary, setNextSummary] = useState(item.nextAction?.summary ?? "");
  const [nextDue, setNextDue] = useState(dueInputValue(item.nextAction?.dueAt));

  useEffect(() => {
    setNextSummary(item.nextAction?.summary ?? "");
    setNextDue(dueInputValue(item.nextAction?.dueAt));
  }, [item.id, item.nextAction?.summary, item.nextAction?.dueAt]);

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
      setStatusPickerOpen(false);
    });

  const onFollowUp = (kind: "note" | "contact") =>
    run(async () => {
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

  const onSetNext = () =>
    run(async () => {
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
    });

  const onClearNext = () =>
    run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/next-action`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await readError(res));
      setNextSummary("");
      setNextDue("");
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
    const transition = item.availableTransitions.find((item) => item.toState === key);
    return transition ? [transition] : [];
  });
  const notes = item.recentActivities.filter((activity) => activity.kind === "note");
  const contacts = item.recentActivities.filter((activity) => activity.kind === "contact");
  const ownerText = item.ownerLabel ?? "Sin responsable";
  const dueText = item.nextAction?.dueAt
    ? formatWhen(item.nextAction.dueAt)
    : "Sin vencimiento";

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: GROWTH_VENTAS_PAGE_TITLE, href: "/admin/ventas" },
        { label: item.personaDisplayName },
      ]}
      title={item.personaDisplayName}
      description={
        item.organizationName
          ? `${item.organizationName} · ${typeLine}`
          : typeLine
      }
      actions={
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
      }
    >
      {dialog}
      <div className={cn("space-y-4", pending && "opacity-70")}>
        {error ? (
          <p className="rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <section className={cardClass}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={statusTone(item.status)} label={item.statusLabel} />
                <span className="text-sm text-muted">
                  {item.funnelName}
                  {item.stageLabel ? ` · ${item.stageLabel}` : ""}
                </span>
              </div>
              <p className="text-sm text-foreground">
                <span className="text-muted">Oportunidad · </span>
                {typeLine || "Sin servicio indicado"}
              </p>
              <p className="text-sm text-foreground">
                <span className="text-muted">Responsable · </span>
                {ownerText}
              </p>
            </div>
            <div className="w-full lg:max-w-xs">
              <OwnerSelect
                opportunityId={item.id}
                ownerUserId={item.ownerUserId}
                members={members}
                disabled={!canOperate}
              />
            </div>
          </div>
        </section>

        <StageTrack track={item.stageTrack} />

        <div
          className={cn(
            cardClass,
            "border-[color-mix(in_srgb,var(--color-primary)_28%,var(--admin-border-subtle))]",
            "bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--admin-surface))]"
          )}
        >
          <p className={aek.label}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {item.nextAction?.summary ?? GROWTH_NO_NEXT_ACTION_LABEL}
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">Responsable</dt>
              <dd className="text-sm font-medium text-foreground">{ownerText}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Vencimiento</dt>
              <dd className="text-sm font-medium text-foreground">{dueText}</dd>
            </div>
          </dl>

          {canOperate ? (
            <div className="mt-4 space-y-3 border-t border-[var(--admin-border-subtle)] pt-4">
              <Input
                aria-label={GROWTH_NEXT_ACTION_SECTION_LABEL}
                value={nextSummary}
                onChange={(e) => setNextSummary(e.target.value)}
                placeholder="Ej. Llamar para confirmar interés"
              />
              <label className="block text-sm">
                <span className="mb-1 block text-muted">Vencimiento</span>
                <Input
                  type="date"
                  aria-label="Vencimiento"
                  value={nextDue}
                  onChange={(e) => setNextDue(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pending || !nextSummary.trim()}
                  onClick={onSetNext}
                >
                  Guardar seguimiento
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending || !item.nextAction}
                  onClick={onClearNext}
                >
                  {GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard label="Oportunidad" value={item.typeLabel} />
          <InfoCard
            label="Asunto"
            value={item.subjectLabel?.trim() || "Sin asunto"}
            pending={!item.subjectLabel?.trim()}
          />
          <InfoCard
            label="Empresa"
            value={item.organizationName?.trim() || "Sin empresa registrada"}
            pending={!item.organizationName?.trim()}
          />
          <InfoCard label="Origen" value={item.originLabel || "Sin origen"} pending={!item.originLabel} />
          <InfoCard label="Embudo" value={item.funnelName} />
          <InfoCard
            label="Apertura"
            value={item.openedAt ? formatWhen(item.openedAt) : "Sin fecha de apertura"}
            pending={!item.openedAt}
          />
          <InfoCard label="Correo" value={item.email || "Sin correo"} pending={!item.email} />
          <InfoCard label="Teléfono" value={item.phone || "Sin teléfono"} pending={!item.phone} />
          {isGrowthFunnelResultKey(item.status) ? (
            <InfoCard
              label="Cierre"
              value={item.closedAt ? formatWhen(item.closedAt) : "Sin fecha de cierre"}
              pending={!item.closedAt}
            />
          ) : null}
        </div>

        {canOperate ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={cn(cardClass, "space-y-3")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-foreground">
                  <span className="text-muted">{GROWTH_VENTAS_CURRENT_STATUS_LABEL}: </span>
                  <span className="font-medium">{item.statusLabel}</span>
                </p>
                {item.availableTransitions.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={statusPickerOpen ? "secondary" : "outline"}
                    disabled={pending}
                    onClick={() => setStatusPickerOpen((open) => !open)}
                  >
                    {GROWTH_VENTAS_CHANGE_STATUS_LABEL}
                  </Button>
                ) : null}
              </div>

              {item.availableTransitions.length === 0 ? (
                <EmptyState
                  title="Sin cambios disponibles"
                  description="Esta situación no admite más cambios desde Ventas."
                />
              ) : null}

              {statusPickerOpen && item.availableTransitions.length > 0 ? (
                <div className="space-y-4 border-t border-[var(--admin-border-subtle)] pt-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Avanzar de etapa</p>
                    {stageMoves.length === 0 ? (
                      <p className="mt-1 text-sm text-muted">No hay otra etapa activa.</p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {stageMoves.map((t) => (
                          <Button
                            key={t.id}
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => askTransition(t)}
                          >
                            {t.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Cerrar</p>
                    {closures.length === 0 ? (
                      <p className="mt-1 text-sm text-muted">No hay un cierre disponible.</p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {closures.map((t) => (
                          <Button
                            key={t.id}
                            type="button"
                            size="sm"
                            variant={t.toState === "won" ? "primary" : "outline"}
                            disabled={pending}
                            onClick={() => askTransition(t)}
                          >
                            {t.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <Section title={GROWTH_VENTAS_FOLLOW_UP_LABEL}>
              <div className={cn(cardClass, "space-y-3")}>
                <Textarea
                  aria-label="Detalle del seguimiento"
                  value={followSummary}
                  onChange={(e) => setFollowSummary(e.target.value)}
                  placeholder={GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER}
                  rows={3}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending || !followSummary.trim()}
                    onClick={() => onFollowUp("note")}
                  >
                    {GROWTH_VENTAS_SAVE_NOTE_LABEL}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending || !followSummary.trim()}
                    onClick={() => onFollowUp("contact")}
                  >
                    {GROWTH_VENTAS_REGISTER_CONTACT_LABEL}
                  </Button>
                </div>
              </div>
            </Section>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Solo lectura: no tienes permiso para operar Oportunidades.
          </p>
        )}

        <FunnelDataFields item={item} canOperate={canOperate} />
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section title={GROWTH_TIMELINE_SECTION_LABEL}>
            <div className={cardClass}>
              <p className="mb-3 text-xs text-muted">Del más reciente al más antiguo.</p>
              <ActivityList
                activities={item.recentActivities}
                empty="Sin hechos registrados aún."
              />
            </div>
          </Section>
          <div className="space-y-4">
            <Section title="Notas">
              <div className={cardClass}>
                <ActivityList activities={notes} empty="Sin notas." />
              </div>
            </Section>
            <Section title="Contactos">
              <div className={cardClass}>
                <ActivityList activities={contacts} empty="Sin contactos registrados." />
              </div>
            </Section>
            <Section title="Conversaciones">
              <div className={cardClass}>
                {item.conversations.length === 0 ? (
                  <p className="text-sm text-muted">Sin conversaciones.</p>
                ) : (
                  <ul className="space-y-3">
                    {item.conversations.map((conversation) => (
                      <li key={conversation.id} className="text-sm">
                        <Link
                          href={`/admin/mensajes?c=${encodeURIComponent(conversation.id)}`}
                          className="font-medium text-foreground underline-offset-2 hover:underline"
                        >
                          {conversation.channelLabel}
                          {conversation.statusLabel ? ` · ${conversation.statusLabel}` : ""}
                        </Link>
                        {conversation.lastMessagePreview ? (
                          <p className="mt-0.5 text-muted">{conversation.lastMessagePreview}</p>
                        ) : (
                          <p className="mt-0.5 text-muted">Sin mensaje.</p>
                        )}
                        <p className="text-xs text-muted">{conversation.timeLabel}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Section>
          </div>
        </div>

        <p className="text-sm text-muted">
          <Link
            href={`/admin/personas/${encodeURIComponent(item.personaId)}`}
            className="font-medium text-primary hover:underline"
          >
            Ver ficha de {item.personaDisplayName}
          </Link>
        </p>
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
      <p className={aek.label}>Etapas</p>
      {track.steps.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Este embudo no tiene etapas configuradas.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <ol className="flex min-w-max items-stretch gap-2 pb-1">
            {track.steps.map((step, index) => (
              <li key={step.key} className="flex items-center gap-2">
                <StagePill step={step} index={index} />
                {index < track.steps.length - 1 ? (
                  <span
                    className="h-px w-4 shrink-0 bg-[var(--admin-border-subtle)]"
                    aria-hidden
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      )}
      {track.resultLabel ? (
        <p className="mt-3 text-sm font-medium text-foreground">
          Cerrada como {track.resultLabel}
        </p>
      ) : null}
      {track.notes.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {track.notes.map((note) => (
            <li key={note} className="text-sm text-muted">
              {note}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function StagePill({ step, index }: { step: OpportunityStageStepView; index: number }) {
  const visited = step.mark === "visited";
  const current = step.mark === "current";
  return (
    <div
      className={cn(
        "flex min-w-[9.5rem] items-center gap-2 rounded-full border px-3 py-2",
        visited &&
          "border-[color-mix(in_srgb,var(--color-success)_45%,var(--admin-border-subtle))] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--admin-surface))]",
        current &&
          "border-[color-mix(in_srgb,var(--color-primary)_55%,var(--admin-border-subtle))] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--admin-surface))]",
        step.mark === "pending" && "border-[var(--admin-border-subtle)] bg-[var(--admin-surface-muted)]"
      )}
      aria-current={current ? "step" : undefined}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          visited && "bg-[var(--color-success)] text-white",
          current && "bg-[var(--color-primary)] text-white",
          step.mark === "pending" && "bg-background text-muted"
        )}
        aria-hidden
      >
        {visited ? <Check className="h-3.5 w-3.5" /> : index + 1}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{step.label}</span>
        <span className="block text-xs text-muted">{step.caption}</span>
      </span>
    </div>
  );
}

function InfoCard({
  label,
  value,
  pending = false,
}: {
  label: string;
  value: string;
  pending?: boolean;
}) {
  return (
    <div className={cn(aek.surface, "px-4 py-3 shadow-[var(--admin-shadow-panel)]")}>
      <p className={aek.label}>{label}</p>
      <p className={cn("mt-1 text-sm font-medium", pending ? "text-muted" : "text-foreground")}>
        {value}
      </p>
    </div>
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
    <Timeline
      items={activities.map((activity) => ({
        id: activity.id,
        title: activity.summary,
        description: activity.kindLabel === activity.summary ? undefined : activity.kindLabel,
        time: activity.occurredAt
          ? `${formatRelativeTime(activity.occurredAt)} · ${formatWhen(activity.occurredAt)}`
          : "Sin fecha",
      }))}
    />
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
                className="mt-1 w-full rounded-[var(--radius-md)] border px-2 py-1.5"
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
