"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import {
  EmptyState,
  Section,
  StatusBadge,
  aek,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import {
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_PERSONAS_ACTIVITY_EMPTY_DESCRIPTION,
  GROWTH_PERSONAS_ACTIVITY_EMPTY_TITLE,
  GROWTH_PERSONAS_ARRIVED_PREFIX,
  GROWTH_PERSONAS_CONVERSATIONS_EMPTY_DESCRIPTION,
  GROWTH_PERSONAS_CONVERSATIONS_EMPTY_TITLE,
  GROWTH_PERSONAS_CONVERSATIONS_SECTION,
  GROWTH_PERSONAS_OPEN_ACTIVITY,
  GROWTH_PERSONAS_OPEN_IN_MESSAGES,
  GROWTH_PERSONAS_OPEN_IN_SALES,
  GROWTH_PERSONAS_OPPORTUNITIES_EMPTY_DESCRIPTION,
  GROWTH_PERSONAS_OPPORTUNITIES_EMPTY_TITLE,
  GROWTH_PERSONAS_PAGE_TITLE,
  GROWTH_RELATED_HISTORY_LABEL,
  GROWTH_TIMELINE_SECTION_LABEL,
  GROWTH_VIEW_DETAIL_LABEL,
} from "@/lib/growth/labels";
import type {
  GrowthNextActionView,
  GrowthOportunidadView,
  GrowthPersonaConversationView,
  GrowthPersonaDetailView,
} from "@/lib/growth/persona-view";
import { cn } from "@/lib/utils";

export interface PersonaDetailClientProps {
  persona: GrowthPersonaDetailView;
  focusOportunidadId?: string;
  canOpenSales?: boolean;
  canOpenMessages?: boolean;
  canOpenActivity?: boolean;
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

function arrivedLabel(originLabel: string): string {
  const trimmed = originLabel.trim();
  if (!trimmed) return "Sin origen claro";
  if (trimmed.toLowerCase().startsWith("llegó")) return trimmed;
  return `${GROWTH_PERSONAS_ARRIVED_PREFIX} ${trimmed}`;
}

function NextActionBlock({ action }: { action: GrowthNextActionView | null }) {
  if (!action) {
    return (
      <div
        className="rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-5 py-5"
        data-persona-next-action="empty"
      >
        <p className={aek.label}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
        <p className="mt-2 text-sm text-muted">{GROWTH_NO_NEXT_ACTION_LABEL}</p>
      </div>
    );
  }

  const due = formatWhen(action.dueAt);

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-primary/20",
        "bg-[color-mix(in_srgb,var(--color-primary)_4%,white)] px-5 py-5"
      )}
      data-persona-next-action="pending"
    >
      <p className={aek.label}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
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
        Ver oportunidad
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

function OportunidadRow({
  op,
  focused,
  isPrimaryAction,
  canOpenSales,
}: {
  op: GrowthOportunidadView;
  focused: boolean;
  isPrimaryAction: boolean;
  canOpenSales: boolean;
}) {
  const showOwnNextAction = !isPrimaryAction && (focused || Boolean(op.nextAction));

  return (
    <li
      id={`oportunidad-${op.id}`}
      className={cn(
        "scroll-mt-24 border-b border-[var(--admin-border-subtle)] py-4 last:border-b-0",
        focused && "rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-primary)_3%,white)] px-3 -mx-1"
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

      {showOwnNextAction ? (
        <p className="mt-3 text-sm text-muted">
          {op.nextAction ? (
            <>
              <span className="font-medium text-foreground">
                {op.nextAction.summary}
              </span>
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
              Todavía no hay hechos ligados a esta oportunidad.
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
          {canOpenSales ? (
            <Link
              href={`/admin/ventas/${encodeURIComponent(op.id)}`}
              className="mt-3.5 inline-flex text-xs font-semibold text-primary hover:underline"
            >
              {GROWTH_PERSONAS_OPEN_IN_SALES}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link
            href={`?oportunidad=${encodeURIComponent(op.id)}#oportunidad-${op.id}`}
            className="inline-flex text-xs font-semibold text-primary hover:underline"
          >
            {GROWTH_VIEW_DETAIL_LABEL}
          </Link>
          {canOpenSales ? (
            <Link
              href={`/admin/ventas/${encodeURIComponent(op.id)}`}
              className="inline-flex text-xs font-semibold text-primary hover:underline"
            >
              {GROWTH_PERSONAS_OPEN_IN_SALES}
            </Link>
          ) : null}
        </div>
      )}
    </li>
  );
}

function ConversationRow({
  conversation,
  canOpenMessages,
}: {
  conversation: GrowthPersonaConversationView;
  canOpenMessages: boolean;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-border-subtle)] py-3.5 last:border-b-0">
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
          {GROWTH_PERSONAS_OPEN_IN_MESSAGES}
        </Link>
      ) : null}
    </li>
  );
}

export function PersonaDetailClient({
  persona,
  focusOportunidadId,
  canOpenSales = false,
  canOpenMessages = false,
  canOpenActivity = false,
}: PersonaDetailClientProps) {
  useEffect(() => {
    if (!focusOportunidadId) return;
    const el = document.getElementById(`oportunidad-${focusOportunidadId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusOportunidadId]);

  const conversations = persona.conversations ?? [];
  const contactLine = [persona.email, persona.phone].filter(Boolean);

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: GROWTH_PERSONAS_PAGE_TITLE, href: "/admin/personas" },
        { label: persona.displayName },
      ]}
      title={persona.displayName}
      description={arrivedLabel(persona.originLabel)}
      actions={
        <Button href="/admin/personas" variant="outline" size="sm">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {GROWTH_PERSONAS_PAGE_TITLE}
        </Button>
      }
    >
      <div className={aek.sectionGap} data-persona-detail>
        <div className="space-y-1">
          {contactLine.length > 0 ? (
            <p className="text-sm text-muted">{contactLine.join(" · ")}</p>
          ) : (
            <p className="text-sm text-muted">Sin correo ni teléfono</p>
          )}
        </div>

        <NextActionBlock action={persona.primaryNextAction} />

        <Section
          title="Oportunidades"
          description="Qué quiere esta persona."
        >
          {persona.oportunidades.length === 0 ? (
            <EmptyState
              title={GROWTH_PERSONAS_OPPORTUNITIES_EMPTY_TITLE}
              description={GROWTH_PERSONAS_OPPORTUNITIES_EMPTY_DESCRIPTION}
              className="bg-[var(--admin-surface)] py-10"
            />
          ) : (
            <ul className="rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-4 sm:px-5">
              {persona.oportunidades.map((op) => (
                <OportunidadRow
                  key={op.id}
                  op={op}
                  focused={focusOportunidadId === op.id}
                  isPrimaryAction={
                    persona.primaryNextAction?.oportunidadId === op.id
                  }
                  canOpenSales={canOpenSales}
                />
              ))}
            </ul>
          )}
        </Section>

        <Section
          title={GROWTH_PERSONAS_CONVERSATIONS_SECTION}
          description="Contexto reciente, sin bandeja."
        >
          {conversations.length === 0 ? (
            <EmptyState
              title={GROWTH_PERSONAS_CONVERSATIONS_EMPTY_TITLE}
              description={GROWTH_PERSONAS_CONVERSATIONS_EMPTY_DESCRIPTION}
              className="bg-[var(--admin-surface)] py-10"
            />
          ) : (
            <ul
              className="rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-4 sm:px-5"
              data-persona-conversations
            >
              {conversations.map((c) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  canOpenMessages={canOpenMessages}
                />
              ))}
            </ul>
          )}
        </Section>

        <Section
          title={GROWTH_TIMELINE_SECTION_LABEL}
          description="Hechos recientes, del más nuevo al más antiguo."
        >
          {persona.activities.length === 0 ? (
            <EmptyState
              title={GROWTH_PERSONAS_ACTIVITY_EMPTY_TITLE}
              description={GROWTH_PERSONAS_ACTIVITY_EMPTY_DESCRIPTION}
              className="bg-[var(--admin-surface)] py-10"
            />
          ) : (
            <ol
              className="rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-5 py-4"
              data-persona-activity
            >
              {persona.activities.map((a, index) => {
                const kindDiffers = a.kindLabel !== a.summary;
                return (
                  <li
                    key={a.id}
                    className={cn(
                      "relative flex gap-3 pb-4 last:pb-0",
                      index < persona.activities.length - 1 &&
                        "after:absolute after:left-[5px] after:top-3 after:h-[calc(100%-4px)] after:w-px after:bg-[var(--admin-border-subtle)]"
                    )}
                  >
                    <span
                      className="relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-primary/50 bg-[var(--admin-surface)]"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {a.summary}
                        </span>
                        <time className="text-xs text-muted">
                          {formatRelativeTime(a.occurredAt)}
                        </time>
                      </div>
                      {kindDiffers ? (
                        <p className="mt-0.5 text-sm text-muted">{a.kindLabel}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {canOpenActivity ? (
            <div className="mt-3">
              <Link
                href="/admin/actividad"
                className="inline-flex text-xs font-semibold text-primary hover:underline"
              >
                {GROWTH_PERSONAS_OPEN_ACTIVITY}
              </Link>
            </div>
          ) : null}
        </Section>
      </div>
    </AdminModulePage>
  );
}
