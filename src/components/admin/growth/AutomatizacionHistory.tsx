"use client";

import { useState } from "react";
import { EmptyState, Section, StatusBadge, aek } from "@/components/admin/kit";
import {
  AUTOMATION_HISTORY_EMPTY_DESCRIPTION,
  AUTOMATION_HISTORY_EMPTY_TITLE,
  AUTOMATION_HISTORY_MORE_DETAIL,
  AUTOMATION_HISTORY_SECTION_DESCRIPTION,
  AUTOMATION_HISTORY_SECTION_TITLE,
  automationRunStatusTone,
} from "@/lib/growth/automations-labels";
import type { AutomationRunHistoryItemView } from "@/lib/growth/automations-history-types";
import { cn } from "@/lib/utils";

export type AutomatizacionHistoryProps = {
  runs: AutomationRunHistoryItemView[];
};

function RunCard({ run }: { run: AutomationRunHistoryItemView }) {
  const [openDetail, setOpenDetail] = useState(false);
  return (
    <article
      className={cn(aek.surface, "space-y-2 px-4 py-4 sm:px-5")}
      data-automation-run-status={run.status}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <time className="text-sm font-medium text-foreground">
          {run.whenLabel}
        </time>
        <StatusBadge
          tone={automationRunStatusTone(run.status)}
          label={run.statusLabel}
        />
      </div>
      <ul className="space-y-1 text-sm text-foreground">
        {run.lines.map((text, i) => (
          <li key={`${run.id}-${i}`}>{text}</li>
        ))}
      </ul>
      {run.errorDetail ? (
        <div className="pt-1">
          <button
            type="button"
            className="text-xs font-medium text-muted underline-offset-2 hover:underline"
            onClick={() => setOpenDetail((v) => !v)}
            aria-expanded={openDetail}
          >
            {AUTOMATION_HISTORY_MORE_DETAIL}
          </button>
          {openDetail ? (
            <p className="mt-1 text-xs text-muted" data-automation-run-detail>
              {run.errorDetail}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/**
 * OT-007 — «Qué ha pasado» dentro de una automatización activa.
 * Solo lenguaje humano; sin ids técnicos.
 */
export function AutomatizacionHistory({ runs }: AutomatizacionHistoryProps) {
  return (
    <Section
      title={AUTOMATION_HISTORY_SECTION_TITLE}
      description={AUTOMATION_HISTORY_SECTION_DESCRIPTION}
      className="mt-2"
      data-automation-history
    >
      {runs.length === 0 ? (
        <EmptyState
          title={AUTOMATION_HISTORY_EMPTY_TITLE}
          description={AUTOMATION_HISTORY_EMPTY_DESCRIPTION}
          className="bg-[var(--admin-surface)] shadow-[var(--admin-shadow-panel)]"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {runs.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </div>
      )}
    </Section>
  );
}
