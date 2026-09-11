/**
 * OT-GROWTH-AUTOMATION-004 — lecturas server-side para UI (Espacio activo).
 */

import "server-only";

import type {
  GrowthAutomation,
  GrowthAutomationStep,
  GrowthAutomationVersion,
} from "@/core/growth/automations/types";
import {
  automationsGet,
  automationsList,
} from "@/lib/growth/automations";
import {
  automationDisplayName,
  automationListThenShort,
  automationListWhenShort,
  automationNaturalSummary,
  automationStatusLabel,
  type AutomationNaturalSummary,
} from "@/lib/growth/automations-labels";

export type AutomationListItemView = {
  id: string;
  name: string;
  status: GrowthAutomation["status"];
  statusLabel: string;
  whenLabel: string;
  thenLabel: string;
  summary: AutomationNaturalSummary;
  href: string;
};

function pickDisplayVersion(
  automation: GrowthAutomation,
  draft: GrowthAutomationVersion | null,
  published: GrowthAutomationVersion | null
): GrowthAutomationVersion | null {
  if (draft) return draft;
  if (published) return published;
  return null;
}

function stepsOf(version: GrowthAutomationVersion | null): GrowthAutomationStep[] {
  return version?.steps ?? [];
}

export async function listAutomationViews(
  tenantId: string
): Promise<AutomationListItemView[]> {
  const items = await automationsList(tenantId);
  const views: AutomationListItemView[] = [];

  for (const automation of items) {
    const detail = await automationsGet(tenantId, automation._id);
    if (!detail.ok) continue;
    const version = pickDisplayVersion(
      detail.automation,
      detail.draft,
      detail.published
    );
    const steps = stepsOf(version);
    views.push({
      id: automation._id,
      name: automationDisplayName(automation.name) || "Automatización",
      status: automation.status,
      statusLabel: automationStatusLabel(automation.status),
      whenLabel: automationListWhenShort(steps),
      thenLabel: automationListThenShort(steps),
      summary: automationNaturalSummary(steps),
      href: `/admin/automatizaciones/${encodeURIComponent(automation._id)}`,
    });
  }

  return views;
}

export type AutomationDetailView = {
  automation: GrowthAutomation;
  draft: GrowthAutomationVersion | null;
  published: GrowthAutomationVersion | null;
  /** Versión editable (borrador) o publicada visible. */
  display: GrowthAutomationVersion | null;
  steps: GrowthAutomationStep[];
  summary: AutomationNaturalSummary;
  /** Hay borrador distinto de la publicada (edición en curso). */
  hasEditableDraft: boolean;
};

export async function getAutomationDetailView(
  tenantId: string,
  automationId: string
): Promise<AutomationDetailView | null> {
  const detail = await automationsGet(tenantId, automationId);
  if (!detail.ok) return null;
  const display = pickDisplayVersion(
    detail.automation,
    detail.draft,
    detail.published
  );
  const steps = stepsOf(display);
  return {
    automation: detail.automation,
    draft: detail.draft,
    published: detail.published,
    display,
    steps,
    summary: automationNaturalSummary(steps),
    hasEditableDraft: detail.draft != null,
  };
}
