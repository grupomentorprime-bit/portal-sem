"use client";

import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Mail,
  MoreHorizontal,
  Phone,
  ShieldCheck,
  Target,
  UserRound,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { EmptyState, StatusBadge, aek } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import type {
  GrowthActivityView,
  GrowthOportunidadView,
  GrowthPersonaConversationView,
} from "@/lib/growth/persona-view";
import {
  groupActivitiesByDate,
  type GrowthPersonaAssessmentTone,
  type GrowthPersonaAssessmentView,
  type GrowthPersonaSignalView,
} from "@/lib/growth/persona-workspace";
import { cn } from "@/lib/utils";
import { OwnerSelect } from "../OwnerSelect";

export const personaPanelClass =
  "rounded-2xl border border-[var(--admin-border-subtle)] bg-white shadow-[var(--admin-shadow-card)]";

const iconTile =
  "grid h-9 w-9 shrink-0 place-items-center rounded-xl";

export function formatPersonaWhen(iso?: string): string | null {
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

export function formatPersonaDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const assessmentToneClass: Record<GrowthPersonaAssessmentTone, string> = {
  clear: "bg-emerald-500",
  doubt: "bg-amber-500",
  gap: "bg-[var(--color-danger)]",
  missing: "bg-slate-400",
};

function signalHint(signal: GrowthPersonaSignalView): string | null {
  if (signal.hintAt) {
    const relative = formatRelativeTime(signal.hintAt);
    return `Último ${relative.charAt(0).toLowerCase()}${relative.slice(1)}`;
  }
  return signal.hint ?? null;
}

const signalIcon = {
  assessments: ClipboardList,
  opportunities: Target,
  gap: FileText,
  consent: ShieldCheck,
} as const;

const signalTone: Record<string, string> = {
  assessments: "bg-[var(--state-info-bg)] text-[var(--state-info-fg)]",
  opportunities: "bg-[var(--state-success-bg)] text-[var(--state-success-fg)]",
  gap: "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-primary",
  consent: "bg-[var(--state-info-bg)] text-[var(--state-info-fg)]",
};

export function PersonaSignalRow({ signals }: { signals: GrowthPersonaSignalView[] }) {
  if (signals.length === 0) return null;
  return (
    <div
      className={cn(
        "grid gap-3",
        signals.length > 1 && "grid-cols-2",
        signals.length > 2 && "xl:grid-cols-4"
      )}
    >
      {signals.map((signal) => {
        const Icon = signalIcon[signal.id as keyof typeof signalIcon] ?? ClipboardList;
        const hint = signalHint(signal);
        const authorized = signal.id === "consent" && signal.value === "Autorizado";
        return (
          <div key={signal.id} className={cn(personaPanelClass, "px-3 py-2.5")}>
            <div className="flex items-center gap-2">
              <span className={cn(iconTile, "h-7 w-7", signalTone[signal.id] ?? signalTone.assessments)}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <p className="text-[11px] font-medium text-muted">{signal.label}</p>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
              {authorized ? (
                <CheckCircle2 className="h-4 w-4 text-[var(--state-success-fg)]" aria-hidden />
              ) : null}
              <span className="line-clamp-2">{signal.value}</span>
            </p>
            {hint ? <p className="mt-1 line-clamp-2 text-xs text-muted">{hint}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export function PersonaOrientationBanner({
  title,
  lines,
  asideTitle,
  asideBody,
  asideHref,
  asideAction,
}: {
  title: string;
  lines: string[];
  asideTitle?: string;
  asideBody?: string;
  asideHref?: string;
  asideAction?: string;
}) {
  return (
    <section
      className={cn(
        "grid gap-4 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,white)]",
        "bg-[linear-gradient(105deg,color-mix(in_srgb,var(--color-primary)_10%,white),color-mix(in_srgb,var(--color-primary)_4%,white)_58%,white)]",
        "px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center"
      )}
    >
      <div className="flex min-w-0 gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-[var(--admin-shadow-card)]">
          <Zap className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <div className="mt-1 max-w-2xl space-y-0.5 text-sm leading-6 text-muted">
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
      {asideTitle ? (
        <div className="rounded-2xl border border-[var(--admin-border-subtle)] bg-white px-4 py-3 shadow-[var(--admin-shadow-card)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{asideTitle}</p>
          {asideBody ? <p className="mt-1 text-sm leading-5 text-foreground">{asideBody}</p> : null}
          {asideHref && asideAction ? (
            <Link href={asideHref} className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline">
              {asideAction}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function PersonaAssessmentCard({
  assessment,
  capturedLabel,
  sourceLabel,
}: {
  assessment: GrowthPersonaAssessmentView;
  capturedLabel?: string | null;
  sourceLabel?: string;
}) {
  const ordered = [...assessment.highlights].sort((a, b) => {
    const rank = (tone?: string) => (tone === "clear" || !tone ? 1 : 0);
    return rank(a.tone) - rank(b.tone);
  });
  return (
    <section className={cn(personaPanelClass, "px-3 py-3 sm:px-4")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-foreground">{assessment.title}</p>
          <p className="mt-0.5 text-sm text-foreground">{assessment.headline}</p>
          {sourceLabel ? <p className="text-xs text-muted">{sourceLabel}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {capturedLabel ? <p className="text-xs text-muted">{capturedLabel}</p> : null}
          {assessment.reportPath ? (
            <Button href={assessment.reportPath} size="sm" variant="outline">
              Ver informe
            </Button>
          ) : null}
        </div>
      </div>
      {ordered.length > 0 ? (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {ordered.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--admin-border-subtle)] px-2.5 py-2"
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    item.tone ? assessmentToneClass[item.tone] : "bg-primary/40"
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] font-semibold text-muted">{item.statusLabel}</p>
                  </div>
                  {item.detail ? <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.detail}</p> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {assessment.priorities.length > 0 ? (
        <ol className="mt-2 flex flex-wrap gap-1.5">
          {assessment.priorities.map((item, index) => (
            <li
              key={item.id}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
            >
              {index + 1}. {item.label}
            </li>
          ))}
        </ol>
      ) : null}
      {assessment.disclaimer ? (
        <p className="mt-3 text-xs leading-5 text-muted">{assessment.disclaimer}</p>
      ) : null}
    </section>
  );
}

export function PersonaAssessmentHistory({
  assessments,
  sourceLabel,
}: {
  assessments: GrowthPersonaAssessmentView[];
  sourceLabel?: string;
}) {
  if (assessments.length === 0) return null;
  return (
    <section className={cn(personaPanelClass, "px-4 py-4 sm:px-5")}>
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
        <p className="text-sm font-semibold text-foreground">Historial de diagnósticos</p>
      </div>
      <ol className="mt-4">
        {assessments.map((assessment, index) => (
          <li key={assessment.id} className="relative flex gap-3 pb-4 last:pb-0">
            {index < assessments.length - 1 ? (
              <span className="absolute left-[7px] top-4 h-[calc(100%-8px)] w-px bg-[var(--admin-border-subtle)]" aria-hidden />
            ) : null}
            <span
              className={cn(
                "relative z-[1] mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full",
                assessmentToneClass[assessment.priorities.length === 0 ? "clear" : "gap"]
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{assessment.title}</p>
                <time className="text-xs text-muted">
                  {formatPersonaDate(assessment.capturedAt)} · {formatRelativeTime(assessment.capturedAt)}
                </time>
              </div>
              <div className="mt-1.5">
                <StatusBadge
                  tone={assessment.priorities.length === 0 ? "active" : "info"}
                  label={assessment.headline}
                />
              </div>
              {sourceLabel ? <p className="mt-1.5 text-xs text-muted">{sourceLabel}</p> : null}
              {assessment.reportPath ? (
                <Link href={assessment.reportPath} className="mt-1.5 inline-flex text-xs font-semibold text-primary hover:underline">
                  Ver informe
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const activityTone: Record<string, { icon: LucideIcon; className: string }> = {
  form_submitted: { icon: FileText, className: "bg-[var(--state-info-bg)] text-[var(--state-info-fg)]" },
  application_received: { icon: ClipboardList, className: "bg-[var(--state-info-bg)] text-[var(--state-info-fg)]" },
  opportunity_opened: { icon: Target, className: "bg-[var(--state-success-bg)] text-[var(--state-success-fg)]" },
  opportunity_transitioned: { icon: Target, className: "bg-[var(--state-warning-bg)] text-[var(--state-warning-fg)]" },
  next_action_set: { icon: Zap, className: "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-primary" },
  note: { icon: FileText, className: "bg-[var(--state-warning-bg)] text-[var(--state-warning-fg)]" },
  contact: { icon: Phone, className: "bg-[var(--state-success-bg)] text-[var(--state-success-fg)]" },
  handoff: { icon: UserRound, className: "bg-[var(--state-info-bg)] text-[var(--state-info-fg)]" },
  identity_updated: { icon: UserRound, className: "bg-background-muted text-muted" },
};

function activityDayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function PersonaActivityList({
  activities,
  emptyTitle,
  emptyDescription,
  relatedHref,
  reportHref,
  compact = false,
}: {
  activities: GrowthActivityView[];
  emptyTitle: string;
  emptyDescription: string;
  relatedHref?: (oportunidadId: string) => string;
  reportHref?: (activity: GrowthActivityView) => string | undefined;
  compact?: boolean;
}) {
  if (activities.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="bg-[var(--admin-surface)] py-6"
      />
    );
  }
  if (compact) {
    return (
      <ol className="space-y-3">
        {activities.map((activity) => {
          const visual = activityTone[activity.kind] ?? activityTone.note;
          const Icon = visual.icon;
          const kindDiffers = activity.kindLabel !== activity.summary;
          return (
            <li key={activity.id} className="flex items-start gap-3">
              <span className={cn(iconTile, "h-8 w-8 rounded-full", visual.className)}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-5 text-foreground">{activity.summary}</p>
                  <time className="shrink-0 text-xs text-muted" dateTime={activity.occurredAt}>
                    {formatRelativeTime(activity.occurredAt)}
                  </time>
                </div>
                {kindDiffers ? <p className="mt-0.5 text-xs text-muted">{activity.kindLabel}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }
  const groups = groupActivitiesByDate(activities, activityDayKey);
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {formatPersonaDate(`${group.key}T12:00:00`)}
          </h3>
          <ol className="mt-1.5 space-y-2">
            {group.items.map((activity) => {
              const visual = activityTone[activity.kind] ?? activityTone.note;
              const Icon = visual.icon;
              const when = formatPersonaWhen(activity.occurredAt);
              const report = reportHref?.(activity);
              const related = activity.oportunidadId
                ? relatedHref?.(activity.oportunidadId)
                : undefined;
              return (
                <li key={activity.id} className="flex items-start gap-2.5">
                  <span className={cn(iconTile, "h-8 w-8 rounded-full", visual.className)}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[11px] font-semibold text-foreground">{activity.kindLabel}</span>
                      <time className="text-[11px] text-muted" dateTime={activity.occurredAt}>
                        {when} · {formatRelativeTime(activity.occurredAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-sm leading-5 text-foreground">{activity.summary}</p>
                    {related || report ? (
                      <div className="mt-1 flex flex-wrap gap-3">
                        {related ? (
                          <Link href={related} className="text-[11px] font-semibold text-primary hover:underline">
                            Ver oportunidad
                          </Link>
                        ) : null}
                        {report ? (
                          <Link href={report} className="text-[11px] font-semibold text-primary hover:underline">
                            Ver informe
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function PersonaContactCard({
  email,
  phone,
  organizationName,
  originLabel,
}: {
  email?: string;
  phone?: string;
  organizationName?: string;
  originLabel?: string;
}) {
  const fields = [
    email ? { label: "Correo electrónico", value: email, icon: Mail } : null,
    phone ? { label: "Teléfono", value: phone, icon: Phone } : null,
    organizationName ? { label: "Empresa", value: organizationName, icon: Building2 } : null,
    originLabel ? { label: "Origen", value: originLabel, icon: ClipboardList } : null,
  ].filter((field): field is NonNullable<typeof field> => field != null);

  return (
    <section className={cn(personaPanelClass, "px-4 py-4 sm:px-5")}>
      <div className="flex items-center gap-2">
        <UserRound className="h-4 w-4 text-primary" aria-hidden />
        <p className="text-sm font-semibold text-foreground">
          {organizationName ? "Datos de contacto y empresa" : "Datos de contacto"}
        </p>
      </div>
      {fields.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Sin correo ni teléfono</p>
      ) : (
        <dl className="mt-4 space-y-3">
          {fields.map((field) => (
            <div key={field.label} className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-background-muted text-muted">
                <field.icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:justify-between sm:gap-3">
                <dt className="text-xs text-muted">{field.label}</dt>
                <dd className="break-words text-sm text-foreground sm:text-right">{field.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export function PersonaNextStep({
  label,
  emptyLabel,
  summary,
  kindLabel,
  support,
  reportHref,
  salesHref,
  salesLabel,
  messagesHref,
  messagesLabel,
  opportunityHref,
  onUpdate,
  onRegisterContact,
}: {
  label: string;
  emptyLabel: string;
  summary?: string;
  kindLabel?: string;
  support?: string | string[];
  reportHref?: string;
  salesHref?: string;
  salesLabel: string;
  messagesHref?: string;
  messagesLabel?: string;
  opportunityHref?: string;
  onUpdate?: () => void;
  onRegisterContact?: () => void;
}) {
  const extras = [
    messagesHref && messagesLabel ? { href: messagesHref, label: messagesLabel } : null,
    opportunityHref ? { href: opportunityHref, label: "Ver oportunidad" } : null,
  ].filter((item): item is { href: string; label: string } => item != null);

  return (
    <section className={cn(personaPanelClass, "px-4 py-4 sm:px-5")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-base font-semibold tracking-tight text-foreground">{label}</h2>
        </div>
        {kindLabel ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {kindLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-4 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_7%,white)] px-4 py-4">
        <div className="flex gap-3">
          <span className={cn(iconTile, "bg-white text-primary shadow-[var(--admin-shadow-card)]")}>
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight text-foreground">
              {summary ?? emptyLabel}
            </p>
            {support ? (
              <div className="mt-1 space-y-0.5 text-sm leading-6 text-muted">
                {(Array.isArray(support) ? support : [support]).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        {summary || onUpdate || onRegisterContact ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onRegisterContact ? (
              <Button type="button" size="sm" onClick={onRegisterContact}>
                Registrar contacto
              </Button>
            ) : null}
            {onUpdate ? (
              <Button type="button" size="sm" variant="outline" onClick={onUpdate}>
                Actualizar
              </Button>
            ) : null}
            {reportHref ? (
              <Button href={reportHref} size="sm" variant={onRegisterContact ? "outline" : "primary"}>
                Ver informe
              </Button>
            ) : null}
            {salesHref ? (
              <Button href={salesHref} size="sm" variant={reportHref ? "outline" : "primary"}>
                {salesLabel}
              </Button>
            ) : null}
            {extras.length > 0 ? (
              <details className="relative">
                <summary className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-lg border border-border bg-white text-muted [&::-webkit-details-marker]:hidden">
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Más acciones</span>
                </summary>
                <div className="absolute right-0 z-10 mt-1 w-48 rounded-xl border border-[var(--admin-border-subtle)] bg-white p-1 shadow-[var(--admin-shadow-card)]">
                  {extras.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-background-muted"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function opportunityStatusTone(status: string): "active" | "inactive" | "info" {
  if (status === "won" || status === "handed_off") return "active";
  if (status === "lost" || status === "archived") return "inactive";
  return "info";
}

export function PersonaOpportunityList({
  oportunidades,
  focusOportunidadId,
  primaryOportunidadId,
  canOpenSales,
  detailHref,
  relatedHistoryLabel,
  emptyTitle,
  emptyDescription,
  noNextActionLabel,
  openInSalesLabel,
  viewDetailLabel,
  canOperate = false,
  members = [],
}: {
  oportunidades: GrowthOportunidadView[];
  focusOportunidadId?: string;
  primaryOportunidadId?: string;
  canOpenSales: boolean;
  detailHref: (id: string) => string;
  relatedHistoryLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  noNextActionLabel: string;
  openInSalesLabel: string;
  viewDetailLabel: string;
  canOperate?: boolean;
  members?: Array<{ userId: string; label: string }>;
}) {
  if (oportunidades.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="bg-[var(--admin-surface)] py-8"
      />
    );
  }

  return (
    <ul className={cn(personaPanelClass, "px-4 sm:px-5")}>
      {oportunidades.map((op) => {
        const focused = focusOportunidadId === op.id;
        const showOwnNextAction = primaryOportunidadId !== op.id || focused || Boolean(op.nextAction);
        return (
          <li
            key={op.id}
            id={`oportunidad-${op.id}`}
            className={cn(
              "scroll-mt-24 border-b border-[var(--admin-border-subtle)] py-4 last:border-b-0",
              focused &&
                "rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-primary)_4%,white)] px-3 -mx-1"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-tight text-foreground">
                  {op.typeLabel}
                  {op.subjectLabel ? ` · ${op.subjectLabel}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted">{op.originLabel}</p>
              </div>
              <StatusBadge tone={opportunityStatusTone(op.status)} label={op.statusLabel} />
            </div>
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-foreground">Responsable: </span>
              {op.ownerLabel ?? "Sin responsable"}
            </p>
            {op.funnelFieldLines && op.funnelFieldLines.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {op.funnelFieldLines.map((line) => (
                  <li key={line.label}>
                    <span className="font-medium text-foreground">{line.label}: </span>
                    {line.value}
                  </li>
                ))}
              </ul>
            ) : null}
            {canOperate && !["won", "lost", "archived", "handed_off"].includes(op.status) ? (
              <div className="mt-3 max-w-sm">
                <OwnerSelect
                  opportunityId={op.id}
                  ownerUserId={op.ownerUserId}
                  members={members}
                />
              </div>
            ) : null}
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-foreground">Siguiente acción: </span>
              {showOwnNextAction && op.nextAction ? (
                <>
                  {op.nextAction.summary}
                  {op.nextAction.dueAt ? ` · ${formatPersonaWhen(op.nextAction.dueAt)}` : ""}
                </>
              ) : (
                noNextActionLabel
              )}
            </p>
            {focused ? (
              <div className="mt-4 border-t border-[var(--admin-border-subtle)] pt-3.5">
                <p className={aek.label}>{relatedHistoryLabel}</p>
                {op.relatedActivities.length === 0 ? (
                  <p className="mt-1.5 text-sm text-muted">
                    Todavía no hay hechos ligados a esta oportunidad.
                  </p>
                ) : (
                  <ul className="mt-2.5 space-y-2">
                    {op.relatedActivities.map((act) => (
                      <li key={act.id} className="text-sm text-foreground">
                        <span className="font-medium">{act.summary}</span>
                        <span className="text-muted">
                          {act.kindLabel !== act.summary ? ` · ${act.kindLabel}` : ""} ·{" "}
                          {formatRelativeTime(act.occurredAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {canOpenSales ? (
                  <Button
                    href={`/admin/ventas/${encodeURIComponent(op.id)}`}
                    size="sm"
                    variant="outline"
                    className="mt-3"
                  >
                    {openInSalesLabel}
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button href={detailHref(op.id)} size="sm" variant="outline">
                  {viewDetailLabel}
                </Button>
                {canOpenSales ? (
                  <Button href={`/admin/ventas/${encodeURIComponent(op.id)}`} size="sm" variant="outline">
                    {openInSalesLabel}
                  </Button>
                ) : null}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function PersonaConversationList({
  conversations,
  canOpenMessages,
  openLabel,
}: {
  conversations: GrowthPersonaConversationView[];
  canOpenMessages: boolean;
  openLabel: string;
}) {
  return (
    <ul className={cn(personaPanelClass, "px-4 sm:px-5")}>
      {conversations.map((conversation) => (
        <li
          key={conversation.id}
          className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-border-subtle)] py-3.5 last:border-b-0"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                {conversation.channelLabel}
              </p>
              {conversation.statusLabel ? (
                <span className="text-xs text-muted">{conversation.statusLabel}</span>
              ) : null}
              {conversation.timeLabel ? (
                <span className="text-xs text-muted">{conversation.timeLabel}</span>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted">
              {conversation.lastMessagePreview || "Sin mensajes aún"}
            </p>
          </div>
          {canOpenMessages ? (
            <Link
              href={`/admin/mensajes?c=${encodeURIComponent(conversation.id)}`}
              className="inline-flex shrink-0 text-xs font-semibold text-primary hover:underline"
            >
              {openLabel}
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function NoteItems({ notes }: { notes: GrowthActivityView[] }) {
  return (
    <ol className={cn(personaPanelClass, "px-3 sm:px-4")}>
      {notes.map((note) => (
        <li
          key={note.id}
          className="border-b border-[var(--admin-border-subtle)] py-2.5 last:border-b-0"
        >
          <p className="text-sm text-foreground">{note.summary}</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {formatPersonaWhen(note.occurredAt)} · {formatRelativeTime(note.occurredAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function PersonaNotesList({
  notes,
  automatic = [],
}: {
  notes: GrowthActivityView[];
  automatic?: GrowthActivityView[];
}) {
  return (
    <div className="space-y-3">
      <section>
        <p className="mb-1.5 text-sm font-semibold text-foreground">Notas</p>
        {notes.length === 0 ? (
          <EmptyState
            title="Todavía no hay notas"
            description="Escribe una nota sobre la oportunidad para dejar constancia del trabajo comercial."
            className="bg-[var(--admin-surface)] py-6"
          />
        ) : (
          <NoteItems notes={notes} />
        )}
      </section>
      {automatic.length > 0 ? (
        <section>
          <p className="mb-1.5 text-sm font-semibold text-foreground">Registro automático</p>
          <NoteItems notes={automatic} />
        </section>
      ) : null}
    </div>
  );
}
