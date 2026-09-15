"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { GrowthOpportunityStatus } from "@/core/growth/types";
import {
  AlertBanner,
  StatusBadge,
  aek,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GrowthCampaignAudienceFilter } from "@/core/growth/campaigns";
import {
  CAMPAIGN_ACTIVATE_CAMPAIGN_CTA,
  CAMPAIGN_ACTIVATE_HINT,
  CAMPAIGN_AUDIENCE_ALL_PREFIX,
  CAMPAIGN_AUDIENCE_EMPTY,
  CAMPAIGN_AUTOMATIONS_EMPTY,
  CAMPAIGN_AUTOMATION_NONE,
  CAMPAIGN_FORMS_EMPTY,
  CAMPAIGN_PAGE_TITLE,
  CAMPAIGN_SAVE_DRAFT_CTA,
  CAMPAIGN_SOURCE_FORM_LABEL,
  CAMPAIGN_SOURCE_NONE_DETAIL,
  CAMPAIGN_SOURCE_NONE_LABEL,
  CAMPAIGN_STEP_1_TITLE,
  CAMPAIGN_STEP_2_TITLE,
  CAMPAIGN_STEP_3_TITLE,
  CAMPAIGN_STEP_4_TITLE,
  CAMPAIGN_WIZARD_TITLE_CREATE,
  CAMPAIGN_WIZARD_TITLE_EDIT,
  campaignAudienceFilterLabel,
  campaignHumanError,
} from "@/lib/growth/campaigns-labels";
import {
  GROWTH_OPPORTUNITY_STATUS_FILTER_OPTIONS,
  GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS,
} from "@/lib/growth/labels";
import { cn } from "@/lib/utils";

export type CampaignOption = { id: string; name: string };

export type AudienceDraftRow = {
  id: string;
  kind: "status" | "typeKey" | "channel" | "form" | "thisCampaign" | "";
  value: string;
};

export interface CampanaFormClientProps {
  mode: "create" | "edit";
  canManage: boolean;
  forms: CampaignOption[];
  automations: CampaignOption[];
  initial?: {
    id: string;
    name: string;
    objective: string;
    trackingKey: string;
    sourceKind: "form" | "none";
    formId: string;
    automationId: string;
    startAt: string;
    endAt: string;
    status: "draft" | "active" | "ended";
    audienceFilters?: GrowthCampaignAudienceFilter[];
  };
}

const STEPS = [
  CAMPAIGN_STEP_1_TITLE,
  CAMPAIGN_STEP_2_TITLE,
  CAMPAIGN_STEP_3_TITLE,
  CAMPAIGN_STEP_4_TITLE,
] as const;

const CHANNEL_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "portal-admision", label: "Portal web" },
  { value: "contact", label: "Contacto" },
  { value: "information_request", label: "Solicitud de información" },
  { value: "event_registration", label: "Inscripción a evento" },
] as const;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function newRowId(): string {
  return `row-${Math.random().toString(36).slice(2, 9)}`;
}

function filtersToDraft(
  filters: GrowthCampaignAudienceFilter[] | undefined,
  trackingKey: string
): AudienceDraftRow[] {
  if (!filters?.length) return [];
  return filters.map((filter) => {
    if (filter.field === "status") {
      return { id: newRowId(), kind: "status", value: filter.value };
    }
    if (filter.field === "typeKey") {
      return { id: newRowId(), kind: "typeKey", value: filter.value };
    }
    if (filter.field === "origin.channel") {
      return { id: newRowId(), kind: "channel", value: filter.value };
    }
    if (filter.field === "origin.formId") {
      return { id: newRowId(), kind: "form", value: filter.value };
    }
    if (filter.field === "origin.campaign") {
      return {
        id: newRowId(),
        kind: filter.value === trackingKey ? "thisCampaign" : "thisCampaign",
        value: filter.value,
      };
    }
    return { id: newRowId(), kind: "", value: "" };
  });
}

function draftToFilters(
  rows: AudienceDraftRow[],
  trackingKey: string
): GrowthCampaignAudienceFilter[] {
  const filters: GrowthCampaignAudienceFilter[] = [];
  for (const row of rows) {
    if (!row.kind) continue;
    if (row.kind === "thisCampaign") {
      if (!trackingKey) continue;
      filters.push({
        field: "origin.campaign",
        op: "eq",
        value: trackingKey,
      });
      continue;
    }
    if (!row.value.trim()) continue;
    if (row.kind === "status") {
      filters.push({
        field: "status",
        op: "eq",
        value: row.value.trim() as GrowthOpportunityStatus,
      });
      continue;
    }
    if (row.kind === "typeKey") {
      filters.push({
        field: "typeKey",
        op: "eq",
        value: row.value.trim(),
      });
      continue;
    }
    if (row.kind === "channel") {
      filters.push({
        field: "origin.channel",
        op: "eq",
        value: row.value.trim(),
      });
      continue;
    }
    if (row.kind === "form") {
      filters.push({
        field: "origin.formId",
        op: "eq",
        value: row.value.trim(),
      });
    }
  }
  return filters;
}

function toIsoLocal(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function CampanaFormClient({
  mode,
  canManage,
  forms,
  automations,
  initial,
}: CampanaFormClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? "");
  const [objective, setObjective] = useState(initial?.objective ?? "");
  const [trackingKey] = useState(() => {
    if (initial?.trackingKey) return initial.trackingKey;
    return "";
  });
  const [sourceKind, setSourceKind] = useState<"form" | "none">(
    initial?.sourceKind ?? "form"
  );
  const [formId, setFormId] = useState(initial?.formId ?? "");
  const [automationId, setAutomationId] = useState(
    initial?.automationId ?? ""
  );
  const [startAt, setStartAt] = useState(initial?.startAt ?? "");
  const [endAt, setEndAt] = useState(initial?.endAt ?? "");
  const [audienceRows, setAudienceRows] = useState<AudienceDraftRow[]>(() =>
    filtersToDraft(initial?.audienceFilters, initial?.trackingKey ?? "")
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const resolvedTrackingKey = useMemo(() => {
    if (mode === "edit" && trackingKey) return trackingKey;
    return slugify(name) || "campana";
  }, [mode, name, trackingKey]);

  const formNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of forms) map[f.id] = f.name;
    return map;
  }, [forms]);

  const selectedFormName =
    forms.find((f) => f.id === formId)?.name ?? null;
  const selectedAutomationName =
    automations.find((a) => a.id === automationId)?.name ?? null;

  const audienceFiltersPreview = draftToFilters(
    audienceRows,
    resolvedTrackingKey
  );
  const audienceLabels = audienceFiltersPreview.map((f) =>
    campaignAudienceFilterLabel(f, {
      formNameById,
      campaignNameByTrackingKey: {
        [resolvedTrackingKey]: name.trim() || "esta campaña",
      },
    })
  );

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!name.trim()) return "Escribe un nombre para la campaña.";
      if (!objective.trim()) return "Describe qué quieres lograr.";
      return null;
    }
    if (current === 1) {
      if (sourceKind === "form") {
        if (forms.length === 0) {
          return "No hay formularios disponibles. Elige solo seguimiento.";
        }
        if (!formId.trim()) return "Selecciona un formulario.";
      }
      return null;
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function save(activateAfter: boolean) {
    if (!canManage) return;
    const step0 = validateStep(0);
    if (step0) {
      setError(step0);
      setStep(0);
      return;
    }
    const step1 = validateStep(1);
    if (step1) {
      setError(step1);
      setStep(1);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const key = resolvedTrackingKey;
      const filters = draftToFilters(audienceRows, key);
      const payload = {
        name: name.trim(),
        objective: objective.trim(),
        trackingKey: key,
        source:
          sourceKind === "form"
            ? { kind: "form" as const, formId: formId.trim() }
            : { kind: "none" as const },
        audience: filters.length > 0 ? { filters } : { filters: [] },
        automationId: automationId.trim() || null,
        startAt: toIsoLocal(startAt),
        endAt: toIsoLocal(endAt),
      };

      let campaignId = initial?.id;
      if (mode === "create") {
        const res = await fetch("/api/growth/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          ok: boolean;
          error?: string;
          code?: string;
          campaign?: { _id: string };
        };
        if (!res.ok || !data.ok || !data.campaign) {
          setError(campaignHumanError(data.code, data.error));
          return;
        }
        campaignId = data.campaign._id;
      } else if (campaignId) {
        const res = await fetch(`/api/growth/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          ok: boolean;
          error?: string;
          code?: string;
        };
        if (!res.ok || !data.ok) {
          setError(campaignHumanError(data.code, data.error));
          return;
        }
      }

      if (activateAfter && campaignId) {
        const res = await fetch(
          `/api/growth/campaigns/${campaignId}/activate`,
          { method: "POST" }
        );
        const data = (await res.json()) as {
          ok: boolean;
          error?: string;
          code?: string;
        };
        if (!res.ok || !data.ok) {
          setError(campaignHumanError(data.code, data.error));
          router.push(`/admin/campanas/${campaignId}`);
          router.refresh();
          return;
        }
      }

      router.push(`/admin/campanas/${campaignId}`);
      router.refresh();
    } catch {
      setError("No pudimos completar la operación.");
    } finally {
      setPending(false);
    }
  }

  const canActivate =
    mode === "create" || initial?.status === "draft";

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: CAMPAIGN_PAGE_TITLE, href: "/admin/campanas" },
        {
          label:
            mode === "create"
              ? CAMPAIGN_WIZARD_TITLE_CREATE
              : CAMPAIGN_WIZARD_TITLE_EDIT,
        },
      ]}
      title={
        mode === "create"
          ? CAMPAIGN_WIZARD_TITLE_CREATE
          : CAMPAIGN_WIZARD_TITLE_EDIT
      }
      description={STEPS[step]}
    >
      <div
        className="mx-auto w-full max-w-2xl space-y-5"
        data-campana-wizard
      >
        <nav aria-label="Pasos" className="flex flex-col gap-2">
          <ol className="flex gap-1.5 overflow-x-auto pb-1">
            {STEPS.map((label, index) => {
              const active = index === step;
              const done = index < step;
              return (
                <li key={label} className="min-w-0 flex-1">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (index < step) {
                        setError(null);
                        setStep(index);
                      }
                    }}
                    className={cn(
                      "w-full rounded-[var(--radius-md)] border px-2 py-2 text-left transition",
                      active
                        ? "border-[color-mix(in_srgb,var(--color-primary)_35%,var(--admin-border-subtle))] bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]"
                        : done
                          ? "border-[var(--admin-border-subtle)] bg-[var(--admin-surface)]"
                          : "border-transparent bg-transparent opacity-70"
                    )}
                  >
                    <span className={cn(aek.label, "block")}>
                      Paso {index + 1}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block truncate text-xs font-medium sm:text-sm",
                        active ? "text-foreground" : "text-muted"
                      )}
                    >
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {error ? (
          <AlertBanner variant="error" title="No se pudo continuar">
            {error}
          </AlertBanner>
        ) : null}

        <div className={cn(aek.surface, "space-y-5 p-4 sm:p-5")}>
          {step === 0 ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold tracking-tight">
                {CAMPAIGN_STEP_1_TITLE}
              </h2>
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Nombre de la campaña</Label>
                <Input
                  id="campaign-name"
                  value={name}
                  disabled={!canManage || pending}
                  placeholder="Ej. Matrículas 2027"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-objective">Objetivo</Label>
                <Textarea
                  id="campaign-objective"
                  value={objective}
                  disabled={!canManage || pending}
                  maxLength={200}
                  placeholder="Qué quieres lograr con esta campaña"
                  onChange={(e) => setObjective(e.target.value)}
                />
                <p className="text-xs text-muted">
                  {objective.length}/200
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="campaign-start">Inicio (opcional)</Label>
                  <Input
                    id="campaign-start"
                    type="datetime-local"
                    value={startAt}
                    disabled={!canManage || pending}
                    onChange={(e) => setStartAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-end">Fin (opcional)</Label>
                  <Input
                    id="campaign-end"
                    type="datetime-local"
                    value={endAt}
                    disabled={!canManage || pending}
                    onChange={(e) => setEndAt(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold tracking-tight">
                {CAMPAIGN_STEP_2_TITLE}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <SourceChoice
                  selected={sourceKind === "form"}
                  title={CAMPAIGN_SOURCE_FORM_LABEL}
                  description="Las personas llegan al completar un formulario."
                  disabled={!canManage || pending}
                  onSelect={() => setSourceKind("form")}
                />
                <SourceChoice
                  selected={sourceKind === "none"}
                  title={CAMPAIGN_SOURCE_NONE_LABEL}
                  description="Acompaña personas que ya están en Growth OS."
                  disabled={!canManage || pending}
                  onSelect={() => setSourceKind("none")}
                />
              </div>
              {sourceKind === "form" ? (
                <div className="space-y-2">
                  <Label htmlFor="campaign-form">Formulario del Espacio</Label>
                  {forms.length === 0 ? (
                    <p className="text-sm text-muted">{CAMPAIGN_FORMS_EMPTY}</p>
                  ) : (
                    <select
                      id="campaign-form"
                      className="w-full rounded-md border border-[var(--admin-border-subtle)] bg-background px-3 py-2 text-sm"
                      value={formId}
                      disabled={!canManage || pending}
                      onChange={(e) => setFormId(e.target.value)}
                    >
                      <option value="">Selecciona un formulario</option>
                      {forms.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  {CAMPAIGN_SOURCE_NONE_DETAIL}
                </p>
              )}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold tracking-tight">
                {CAMPAIGN_STEP_3_TITLE}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    Audiencia (opcional)
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canManage || pending}
                    onClick={() =>
                      setAudienceRows((rows) => [
                        ...rows,
                        { id: newRowId(), kind: "", value: "" },
                      ])
                    }
                  >
                    Añadir condición
                  </Button>
                </div>
                {audienceRows.length === 0 ? (
                  <p className="text-sm text-muted">
                    Sin filtros. Se acompañará según la fuente de la campaña.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {audienceRows.length > 1 ? (
                      <p className="text-sm text-muted">
                        {CAMPAIGN_AUDIENCE_ALL_PREFIX}
                      </p>
                    ) : null}
                    {audienceRows.map((row) => (
                      <AudienceRowEditor
                        key={row.id}
                        row={row}
                        forms={forms}
                        disabled={!canManage || pending}
                        onChange={(next) =>
                          setAudienceRows((rows) =>
                            rows.map((r) => (r.id === row.id ? next : r))
                          )
                        }
                        onRemove={() =>
                          setAudienceRows((rows) =>
                            rows.filter((r) => r.id !== row.id)
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t border-[var(--admin-border-subtle)] pt-4">
                <Label htmlFor="campaign-auto">Automatización (opcional)</Label>
                {automations.length === 0 ? (
                  <p className="text-sm text-muted">
                    {CAMPAIGN_AUTOMATIONS_EMPTY}
                  </p>
                ) : (
                  <select
                    id="campaign-auto"
                    className="w-full rounded-md border border-[var(--admin-border-subtle)] bg-background px-3 py-2 text-sm"
                    value={automationId}
                    disabled={!canManage || pending}
                    onChange={(e) => setAutomationId(e.target.value)}
                  >
                    <option value="">Sin seguimiento automático</option>
                    {automations.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <h2 className="text-base font-semibold tracking-tight">
                {CAMPAIGN_STEP_4_TITLE}
              </h2>
              <ReviewBlock title="Qué quieres lograr">
                <p className="font-medium text-foreground">{name.trim()}</p>
                <p className="mt-1 text-sm text-muted">{objective.trim()}</p>
              </ReviewBlock>
              <ReviewBlock title="De dónde llegarán">
                {sourceKind === "form" ? (
                  <p className="text-sm text-foreground">
                    Formulario: {selectedFormName ?? "Formulario"}
                  </p>
                ) : (
                  <p className="text-sm text-foreground">
                    {CAMPAIGN_SOURCE_NONE_LABEL}
                  </p>
                )}
              </ReviewBlock>
              <ReviewBlock title="A quién acompañarás">
                {audienceLabels.length === 0 ? (
                  <p className="text-sm text-muted">{CAMPAIGN_AUDIENCE_EMPTY}</p>
                ) : (
                  <ul className="space-y-1 text-sm text-foreground">
                    {audienceLabels.length > 1 ? (
                      <li className="text-muted">
                        {CAMPAIGN_AUDIENCE_ALL_PREFIX}
                      </li>
                    ) : null}
                    {audienceLabels.map((label) => (
                      <li key={label}>· {label}</li>
                    ))}
                  </ul>
                )}
              </ReviewBlock>
              <ReviewBlock title="Seguimiento automático">
                {selectedAutomationName ? (
                  <p className="text-sm text-foreground">
                    {selectedAutomationName}
                  </p>
                ) : (
                  <p className="text-sm text-muted">{CAMPAIGN_AUTOMATION_NONE}</p>
                )}
              </ReviewBlock>
              {canActivate ? (
                <p className="rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-primary)_6%,white)] px-3 py-2.5 text-sm text-muted">
                  {CAMPAIGN_ACTIVATE_HINT}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--admin-border-subtle)] pt-4">
            <div>
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={goBack}
                >
                  Atrás
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  disabled={!canManage || pending}
                  onClick={goNext}
                >
                  Continuar
                </Button>
              ) : canManage ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() => void save(false)}
                  >
                    {canActivate
                      ? CAMPAIGN_SAVE_DRAFT_CTA
                      : "Guardar cambios"}
                  </Button>
                  {canActivate ? (
                    <Button
                      type="button"
                      disabled={pending}
                      onClick={() => void save(true)}
                    >
                      {CAMPAIGN_ACTIVATE_CAMPAIGN_CTA}
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>

        {pending ? (
          <p className="text-center text-sm text-muted" aria-live="polite">
            Guardando…
          </p>
        ) : null}
      </div>
    </AdminModulePage>
  );
}

function SourceChoice({
  selected,
  title,
  description,
  disabled,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "rounded-[var(--radius-lg)] border px-4 py-3 text-left transition",
        selected
          ? "border-[color-mix(in_srgb,var(--color-primary)_40%,var(--admin-border-subtle))] bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]"
          : "border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] hover:border-[color-mix(in_srgb,var(--color-primary)_20%,var(--admin-border-subtle))]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {selected ? (
          <StatusBadge tone="active" label="Elegido" />
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </button>
  );
}

function ReviewBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className={aek.label}>{title}</h3>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

function AudienceRowEditor({
  row,
  forms,
  disabled,
  onChange,
  onRemove,
}: {
  row: AudienceDraftRow;
  forms: CampaignOption[];
  disabled?: boolean;
  onChange: (next: AudienceDraftRow) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--admin-border-subtle)] p-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-2">
        <Label>Condición</Label>
        <select
          className="w-full rounded-md border border-[var(--admin-border-subtle)] bg-background px-3 py-2 text-sm"
          value={row.kind}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              ...row,
              kind: e.target.value as AudienceDraftRow["kind"],
              value: "",
            })
          }
        >
          <option value="">Elige una condición</option>
          <option value="status">Estado de la oportunidad</option>
          <option value="typeKey">Tipo de oportunidad</option>
          <option value="channel">Llegaron por un canal</option>
          <option value="form">Llegaron desde un formulario</option>
          <option value="thisCampaign">Llegaron desde esta campaña</option>
        </select>
      </div>

      {row.kind === "status" ? (
        <div className="min-w-0 flex-1 space-y-2">
          <Label>Estado</Label>
          <select
            className="w-full rounded-md border border-[var(--admin-border-subtle)] bg-background px-3 py-2 text-sm"
            value={row.value}
            disabled={disabled}
            onChange={(e) => onChange({ ...row, value: e.target.value })}
          >
            <option value="">Selecciona</option>
            {GROWTH_OPPORTUNITY_STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {row.kind === "typeKey" ? (
        <div className="min-w-0 flex-1 space-y-2">
          <Label>Tipo</Label>
          <select
            className="w-full rounded-md border border-[var(--admin-border-subtle)] bg-background px-3 py-2 text-sm"
            value={row.value}
            disabled={disabled}
            onChange={(e) => onChange({ ...row, value: e.target.value })}
          >
            <option value="">Selecciona</option>
            {GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {row.kind === "channel" ? (
        <div className="min-w-0 flex-1 space-y-2">
          <Label>Canal</Label>
          <select
            className="w-full rounded-md border border-[var(--admin-border-subtle)] bg-background px-3 py-2 text-sm"
            value={row.value}
            disabled={disabled}
            onChange={(e) => onChange({ ...row, value: e.target.value })}
          >
            <option value="">Selecciona</option>
            {CHANNEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {row.kind === "form" ? (
        <div className="min-w-0 flex-1 space-y-2">
          <Label>Formulario</Label>
          {forms.length === 0 ? (
            <p className="text-sm text-muted">{CAMPAIGN_FORMS_EMPTY}</p>
          ) : (
            <select
              className="w-full rounded-md border border-[var(--admin-border-subtle)] bg-background px-3 py-2 text-sm"
              value={row.value}
              disabled={disabled}
              onChange={(e) => onChange({ ...row, value: e.target.value })}
            >
              <option value="">Selecciona</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : null}

      {row.kind === "thisCampaign" ? (
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">
            Personas atribuidas a esta campaña.
          </p>
        </div>
      ) : null}

      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={onRemove}
      >
        Quitar
      </Button>
    </div>
  );
}
