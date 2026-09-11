"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { AlertBanner, StatusBadge, aek } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  GrowthAutomation,
  GrowthAutomationStep,
} from "@/core/growth/automations/types";
import {
  automationFormFromSteps,
  buildAutomationStepsFromForm,
  EMPTY_AUTOMATION_EDITOR_FORM,
  AUTOMATION_WAIT_UNIT_OPTIONS,
  type AutomationEditorForm,
  type AutomationWaitUnit,
} from "@/lib/growth/automations-form";
import {
  AUTOMATION_ACTION_OPTIONS,
  AUTOMATION_ACTIVATE_CTA,
  AUTOMATION_AFTER_WAIT_DESCRIPTION,
  AUTOMATION_AFTER_WAIT_TITLE,
  AUTOMATION_CONDITION_KIND_OPTIONS,
  AUTOMATION_CREATE_CTA,
  AUTOMATION_DEACTIVATE_CTA,
  AUTOMATION_EDIT_CTA,
  AUTOMATION_EVENT_OPTIONS,
  AUTOMATION_ORIGIN_CHANNEL_OPTIONS,
  AUTOMATION_ORIGIN_KIND_OPTIONS,
  AUTOMATION_PAGE_TITLE,
  AUTOMATION_REVIEW_CTA,
  AUTOMATION_SAVE_DRAFT_CTA,
  AUTOMATION_STATUS_FILTER_OPTIONS,
  AUTOMATION_TYPE_FILTER_OPTIONS,
  AUTOMATION_WAIT_BLOCK_DESCRIPTION,
  AUTOMATION_WAIT_BLOCK_TITLE,
  AUTOMATION_WAIT_TOGGLE_LABEL,
  automationDisplayName,
  automationNaturalProse,
  automationStatusLabel,
  automationStatusTone,
} from "@/lib/growth/automations-labels";
import type { AutomationRunHistoryItemView } from "@/lib/growth/automations-history-types";
import { GROWTH_NEXT_ACTION_SECTION_LABEL } from "@/lib/growth/labels";
import { cn } from "@/lib/utils";
import { AutomatizacionHistory } from "./AutomatizacionHistory";

const NEXT_ACTION_LABEL = GROWTH_NEXT_ACTION_SECTION_LABEL;

export type AutomatizacionEditorMode = "create" | "edit";

export interface AutomatizacionEditorClientProps {
  mode: AutomatizacionEditorMode;
  canManage: boolean;
  automation?: GrowthAutomation;
  initialSteps?: GrowthAutomationStep[];
  /** Vista solo lectura de la versión publicada (sin borrador aún). */
  readOnlyPublished?: boolean;
  /** OT-007 — ejecuciones recientes (solo activa). */
  historyRuns?: AutomationRunHistoryItemView[];
}

type Phase = "edit" | "review";

async function parseJson(res: Response): Promise<{
  ok: boolean;
  error?: string;
  automation?: GrowthAutomation;
  code?: string;
}> {
  try {
    return (await res.json()) as {
      ok: boolean;
      error?: string;
      automation?: GrowthAutomation;
      code?: string;
    };
  } catch {
    return { ok: false, error: "Respuesta inválida del servidor." };
  }
}

function OriginOptions() {
  return [
    ...AUTOMATION_ORIGIN_KIND_OPTIONS.map((o) => ({
      value: `kind:${o.value}`,
      label: o.label,
    })),
    ...AUTOMATION_ORIGIN_CHANNEL_OPTIONS.map((o) => ({
      value: `channel:${o.value}`,
      label: o.label,
    })),
  ];
}

function SummaryBlock({
  steps,
}: {
  steps: GrowthAutomationStep[];
}) {
  const prose = automationNaturalProse(steps);
  return (
    <div
      className={cn(aek.surface, "space-y-3 px-4 py-5")}
      data-automation-summary
    >
      <p className="whitespace-pre-line text-[15px] font-medium text-foreground">
        {prose}
      </p>
    </div>
  );
}

function FlowBlock({
  index,
  title,
  description,
  children,
}: {
  index: number | string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(aek.surface, "space-y-4 px-4 py-5 sm:px-5")}
      data-automation-flow-step={index}
    >
      <header>
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
          <span className="tabular-nums text-muted">{index} · </span>
          {title}
        </h3>
        {description ? (
          <p className={cn(aek.meta, "mt-1")}>{description}</p>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FlowArrow() {
  return (
    <div
      className="flex items-center justify-center py-0.5 text-lg leading-none text-muted"
      aria-hidden
    >
      ↓
    </div>
  );
}

function ActionFields({
  form,
  disabled,
  target,
  onPatch,
}: {
  form: AutomationEditorForm;
  disabled: boolean;
  target: "pre" | "post";
  onPatch: (partial: Partial<AutomationEditorForm>) => void;
}) {
  const actionType =
    target === "pre" ? form.actionType : form.postActionType;
  const nextActionSummary =
    target === "pre" ? form.nextActionSummary : form.postNextActionSummary;
  const followUpKind =
    target === "pre" ? form.followUpKind : form.postFollowUpKind;
  const followUpSummary =
    target === "pre" ? form.followUpSummary : form.postFollowUpSummary;
  const transitionToState =
    target === "pre" ? form.transitionToState : form.postTransitionToState;
  const idPrefix = target === "pre" ? "pre" : "post";

  return (
    <>
      <Select
        id={`automation-action-${idPrefix}`}
        label="Acción"
        value={actionType}
        disabled={disabled}
        onChange={(e) => {
          const value = e.target
            .value as AutomationEditorForm["actionType"];
          if (target === "pre") onPatch({ actionType: value });
          else onPatch({ postActionType: value });
        }}
        options={AUTOMATION_ACTION_OPTIONS}
        placeholder="Seleccionar…"
      />

      {actionType === "salesSetNextAction" ? (
        <Input
          id={`automation-next-summary-${idPrefix}`}
          label={NEXT_ACTION_LABEL}
          value={nextActionSummary}
          disabled={disabled}
          onChange={(e) => {
            if (target === "pre") {
              onPatch({ nextActionSummary: e.target.value });
            } else {
              onPatch({ postNextActionSummary: e.target.value });
            }
          }}
          placeholder={
            target === "pre"
              ? "Llamar para confirmar interés"
              : "Volver a contactar"
          }
        />
      ) : null}

      {actionType === "salesRecordFollowUp" ? (
        <div className="space-y-3">
          <Select
            id={`automation-followup-kind-${idPrefix}`}
            label="Tipo de seguimiento"
            value={followUpKind}
            disabled={disabled}
            onChange={(e) => {
              const value = e.target.value as "note" | "contact";
              if (target === "pre") onPatch({ followUpKind: value });
              else onPatch({ postFollowUpKind: value });
            }}
            options={[
              { value: "note", label: "Nota" },
              { value: "contact", label: "Contacto" },
            ]}
          />
          <Textarea
            id={`automation-followup-summary-${idPrefix}`}
            label="Detalle"
            value={followUpSummary}
            disabled={disabled}
            onChange={(e) => {
              if (target === "pre") {
                onPatch({ followUpSummary: e.target.value });
              } else {
                onPatch({ postFollowUpSummary: e.target.value });
              }
            }}
            rows={3}
            placeholder={
              target === "post" ? "Volver a contactar" : undefined
            }
          />
        </div>
      ) : null}

      {actionType === "salesTransitionOpportunity" ? (
        <Select
          id={`automation-transition-${idPrefix}`}
          label="Nuevo estado"
          value={transitionToState}
          disabled={disabled}
          onChange={(e) => {
            const value = e.target
              .value as AutomationEditorForm["transitionToState"];
            if (target === "pre") onPatch({ transitionToState: value });
            else onPatch({ postTransitionToState: value });
          }}
          options={[...AUTOMATION_STATUS_FILTER_OPTIONS]}
        />
      ) : null}
    </>
  );
}

export function AutomatizacionEditorClient({
  mode,
  canManage,
  automation,
  initialSteps = [],
  readOnlyPublished = false,
  historyRuns,
}: AutomatizacionEditorClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("edit");
  const [error, setError] = useState<string | null>(null);
  const [reviewSteps, setReviewSteps] = useState<GrowthAutomationStep[] | null>(
    null
  );
  const displayName = automationDisplayName(automation?.name ?? "");
  const [form, setForm] = useState<AutomationEditorForm>(() =>
    mode === "edit" && initialSteps.length > 0
      ? automationFormFromSteps(displayName, initialSteps)
      : {
          ...EMPTY_AUTOMATION_EDITOR_FORM,
          name: displayName,
          eventType: "GrowthOpportunityOpened",
          actionType: "salesSetNextAction",
          nextActionSummary: "Llamar para confirmar interés",
          conditionEnabled: true,
          conditionKind: "origin",
          originValue: "channel:portal-admision",
        }
  );
  const [savedId, setSavedId] = useState<string | null>(automation?._id ?? null);
  const [editingUnlocked, setEditingUnlocked] = useState(
    mode === "create" || Boolean(automation?.draftVersion)
  );

  const title =
    mode === "create"
      ? AUTOMATION_CREATE_CTA
      : automationDisplayName(form.name || automation?.name || "") ||
        AUTOMATION_PAGE_TITLE;

  const breadcrumbLabel =
    mode === "create"
      ? "Nueva"
      : automationDisplayName(form.name || automation?.name || "") ||
        "Detalle";

  const patch = (partial: Partial<AutomationEditorForm>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setError(null);
  };

  const built = buildAutomationStepsFromForm(form);

  const saveDraft = async (): Promise<string | null> => {
    if (!built.ok) {
      setError(built.error);
      return null;
    }
    const name = automationDisplayName(form.name);
    if (!name) {
      setError("Pon un nombre a la automatización.");
      return null;
    }

    if (savedId) {
      const res = await fetch(
        `/api/growth/automations/${encodeURIComponent(savedId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, steps: built.steps }),
        }
      );
      const data = await parseJson(res);
      if (!data.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return null;
      }
      setEditingUnlocked(true);
      return savedId;
    }

    const res = await fetch("/api/growth/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, steps: built.steps }),
    });
    const data = await parseJson(res);
    if (!data.ok || !data.automation) {
      setError(data.error ?? "No se pudo crear.");
      return null;
    }
    setSavedId(data.automation._id);
    setEditingUnlocked(true);
    return data.automation._id;
  };

  const onSaveDraft = () => {
    if (!canManage) return;
    startTransition(async () => {
      const id = await saveDraft();
      if (!id) return;
      router.replace(`/admin/automatizaciones/${encodeURIComponent(id)}`);
      router.refresh();
    });
  };

  const onReview = () => {
    if (!canManage) {
      setError("No tienes permiso para modificar automatizaciones.");
      return;
    }
    const next = buildAutomationStepsFromForm(form);
    if (!next.ok) {
      setError(next.error);
      return;
    }
    if (!automationDisplayName(form.name)) {
      setError("Pon un nombre a la automatización.");
      return;
    }
    setError(null);
    setReviewSteps(next.steps);
    setPhase("review");
  };

  const onActivate = () => {
    if (!canManage) return;
    startTransition(async () => {
      const id = await saveDraft();
      if (!id) return;
      const res = await fetch(
        `/api/growth/automations/${encodeURIComponent(id)}/publish`,
        { method: "POST" }
      );
      const data = await parseJson(res);
      if (!data.ok) {
        setError(data.error ?? "No se pudo activar.");
        return;
      }
      router.replace(`/admin/automatizaciones/${encodeURIComponent(id)}`);
      router.refresh();
      setPhase("edit");
    });
  };

  const onDeactivate = () => {
    if (!canManage || !savedId) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/growth/automations/${encodeURIComponent(savedId)}/active`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: false }),
        }
      );
      const data = await parseJson(res);
      if (!data.ok) {
        setError(data.error ?? "No se pudo desactivar.");
        return;
      }
      router.refresh();
    });
  };

  const onReactivate = () => {
    if (!canManage || !savedId) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/growth/automations/${encodeURIComponent(savedId)}/active`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: true }),
        }
      );
      const data = await parseJson(res);
      if (!data.ok) {
        setError(data.error ?? "No se pudo activar.");
        return;
      }
      router.refresh();
    });
  };

  const onStartEditPublished = () => {
    if (!canManage || !savedId || !built.ok) return;
    // PUT sin borrador crea nuevo draft (modelo AUTOMATION-002).
    startTransition(async () => {
      const name =
        automationDisplayName(form.name || automation?.name || "") ||
        AUTOMATION_PAGE_TITLE;
      const res = await fetch(
        `/api/growth/automations/${encodeURIComponent(savedId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            steps: built.ok ? built.steps : initialSteps,
          }),
        }
      );
      const data = await parseJson(res);
      if (!data.ok) {
        setError(data.error ?? "No se pudo abrir el borrador.");
        return;
      }
      setEditingUnlocked(true);
      router.refresh();
    });
  };

  const formLocked =
    !canManage ||
    (readOnlyPublished && !editingUnlocked) ||
    (automation?.status === "active" &&
      automation.draftVersion == null &&
      !editingUnlocked);

  const showLifecycle =
    canManage && mode === "edit" && automation && automation.publishedVersion != null;

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: AUTOMATION_PAGE_TITLE, href: "/admin/automatizaciones" },
        { label: breadcrumbLabel },
      ]}
      title={title}
      description={
        phase === "review"
          ? "Revisa qué ocurrirá antes de activarla."
          : "De arriba hacia abajo: cuándo, si aplica, qué hacer y, si hace falta, una espera."
      }
      actions={
        automation ? (
          <StatusBadge
            tone={automationStatusTone(automation.status)}
            label={automationStatusLabel(automation.status)}
          />
        ) : null
      }
    >
      <div
        className="mx-auto flex w-full max-w-xl flex-col gap-4"
        data-automation-editor-phase={phase}
      >
        {error ? (
          <AlertBanner variant="error" title={error}>
            Revisa la configuración e inténtalo de nuevo.
          </AlertBanner>
        ) : null}

        {phase === "review" && reviewSteps ? (
          <>
            <SummaryBlock steps={reviewSteps} />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={onActivate}
              >
                {AUTOMATION_ACTIVATE_CTA}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setPhase("edit");
                  setReviewSteps(null);
                }}
              >
                Volver a editar
              </Button>
            </div>
          </>
        ) : (
          <>
            {formLocked && canManage ? (
              <AlertBanner variant="info" title="Versión activa">
                Esta versión no se modifica directamente. Abre un borrador
                nuevo para cambiarla.
              </AlertBanner>
            ) : null}

            {!canManage ? (
              <SummaryBlock steps={initialSteps} />
            ) : (
              <div className="flex flex-col gap-0" data-automation-flow>
                <div className={cn(aek.surface, "space-y-4 px-4 py-5 sm:px-5")}>
                  <Input
                    label="Nombre"
                    value={form.name}
                    disabled={pending || formLocked}
                    onChange={(e) =>
                      patch({
                        name: automationDisplayName(e.target.value),
                      })
                    }
                    placeholder="Seguimiento de nuevas oportunidades"
                  />
                </div>

                <FlowArrow />

                <FlowBlock
                  index={1}
                  title="Cuando pase esto"
                  description="Elige el hecho que la pone en marcha."
                >
                  <Select
                    label="Se activa cuando"
                    value={form.eventType}
                    disabled={pending || formLocked}
                    onChange={(e) =>
                      patch({
                        eventType: e.target
                          .value as AutomationEditorForm["eventType"],
                      })
                    }
                    options={AUTOMATION_EVENT_OPTIONS}
                    placeholder="Seleccionar…"
                  />
                </FlowBlock>

                <FlowArrow />

                <FlowBlock
                  index={2}
                  title="Si se cumple esto"
                  description="Opcional. Filtra cuándo debe actuar."
                >
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={form.conditionEnabled}
                      disabled={pending || formLocked}
                      onChange={(e) =>
                        patch({
                          conditionEnabled: e.target.checked,
                          conditionKind: e.target.checked
                            ? form.conditionKind || "origin"
                            : "",
                        })
                      }
                    />
                    Añadir condición
                  </label>

                  {form.conditionEnabled ? (
                    <div className="space-y-3">
                      <Select
                        label="Condición"
                        value={form.conditionKind}
                        disabled={pending || formLocked}
                        onChange={(e) =>
                          patch({
                            conditionKind: e.target
                              .value as AutomationEditorForm["conditionKind"],
                          })
                        }
                        options={[...AUTOMATION_CONDITION_KIND_OPTIONS]}
                      />
                      {form.conditionKind === "origin" ? (
                        <Select
                          label="Origen"
                          value={form.originValue}
                          disabled={pending || formLocked}
                          onChange={(e) =>
                            patch({ originValue: e.target.value })
                          }
                          options={OriginOptions()}
                        />
                      ) : null}
                      {form.conditionKind === "status" ? (
                        <Select
                          label="Estado"
                          value={form.statusValue}
                          disabled={pending || formLocked}
                          onChange={(e) =>
                            patch({
                              statusValue: e.target
                                .value as AutomationEditorForm["statusValue"],
                            })
                          }
                          options={[...AUTOMATION_STATUS_FILTER_OPTIONS]}
                        />
                      ) : null}
                      {form.conditionKind === "typeKey" ? (
                        <Select
                          label="Tipo"
                          value={form.typeKey}
                          disabled={pending || formLocked}
                          onChange={(e) =>
                            patch({ typeKey: e.target.value })
                          }
                          options={[...AUTOMATION_TYPE_FILTER_OPTIONS]}
                        />
                      ) : null}
                      {form.conditionKind === "nextAction" ? (
                        <Select
                          label={NEXT_ACTION_LABEL}
                          value={form.nextActionOp}
                          disabled={pending || formLocked}
                          onChange={(e) =>
                            patch({
                              nextActionOp: e.target.value as
                                | "exists"
                                | "absent",
                            })
                          }
                          options={[
                            {
                              value: "absent",
                              label: `No tiene «${NEXT_ACTION_LABEL}»`,
                            },
                            {
                              value: "exists",
                              label: `Tiene «${NEXT_ACTION_LABEL}»`,
                            },
                          ]}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </FlowBlock>

                <FlowArrow />

                <FlowBlock
                  index={3}
                  title="Hacer esto"
                  description="Solo acciones que el sistema puede ejecutar hoy."
                >
                  <ActionFields
                    form={form}
                    disabled={pending || formLocked}
                    target="pre"
                    onPatch={patch}
                  />

                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={form.waitEnabled}
                      disabled={pending || formLocked}
                      onChange={(e) =>
                        patch({
                          waitEnabled: e.target.checked,
                          postActionType: e.target.checked
                            ? form.postActionType || "salesRecordFollowUp"
                            : form.postActionType,
                          postFollowUpSummary: e.target.checked
                            ? form.postFollowUpSummary || "Volver a contactar"
                            : form.postFollowUpSummary,
                        })
                      }
                    />
                    {AUTOMATION_WAIT_TOGGLE_LABEL}
                  </label>
                </FlowBlock>

                {form.waitEnabled ? (
                  <>
                    <FlowArrow />

                    <FlowBlock
                      index={4}
                      title={AUTOMATION_WAIT_BLOCK_TITLE}
                      description={AUTOMATION_WAIT_BLOCK_DESCRIPTION}
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input
                          label="Cantidad"
                          type="number"
                          min={1}
                          inputMode="numeric"
                          value={form.waitAmount}
                          disabled={pending || formLocked}
                          onChange={(e) =>
                            patch({ waitAmount: e.target.value })
                          }
                        />
                        <Select
                          label="Unidad"
                          value={form.waitUnit}
                          disabled={pending || formLocked}
                          onChange={(e) =>
                            patch({
                              waitUnit: e.target.value as AutomationWaitUnit,
                            })
                          }
                          options={[...AUTOMATION_WAIT_UNIT_OPTIONS]}
                        />
                      </div>
                    </FlowBlock>

                    <FlowArrow />

                    <FlowBlock
                      index={5}
                      title={AUTOMATION_AFTER_WAIT_TITLE}
                      description={AUTOMATION_AFTER_WAIT_DESCRIPTION}
                    >
                      <ActionFields
                        form={form}
                        disabled={pending || formLocked}
                        target="post"
                        onPatch={patch}
                      />
                    </FlowBlock>
                  </>
                ) : null}
              </div>
            )}

            {canManage ? (
              <div className="flex flex-wrap gap-2 border-t border-[var(--admin-border-subtle)] pt-4">
                {formLocked ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={onStartEditPublished}
                  >
                    {AUTOMATION_EDIT_CTA}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={onSaveDraft}
                    >
                      {AUTOMATION_SAVE_DRAFT_CTA}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={onReview}
                    >
                      {AUTOMATION_REVIEW_CTA}
                    </Button>
                  </>
                )}

                {showLifecycle && automation.status === "active" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={onDeactivate}
                  >
                    {AUTOMATION_DEACTIVATE_CTA}
                  </Button>
                ) : null}

                {showLifecycle && automation.status === "disabled" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={onReactivate}
                  >
                    {AUTOMATION_ACTIVATE_CTA}
                  </Button>
                ) : null}
              </div>
            ) : null}

            {canManage && !formLocked && built.ok ? (
              <div className="pt-2">
                <p className={cn(aek.label, "mb-2")}>Vista previa</p>
                <SummaryBlock steps={built.steps} />
              </div>
            ) : null}
          </>
        )}

        {automation?.status === "active" && historyRuns ? (
          <AutomatizacionHistory runs={historyRuns} />
        ) : null}
      </div>
    </AdminModulePage>
  );
}
