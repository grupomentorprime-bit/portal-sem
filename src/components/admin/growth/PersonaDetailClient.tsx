"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import {
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_NO_NEXT_ACTION_LABEL,
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
import type { GrowthPersonaDetailView } from "@/lib/growth/persona-view";
import {
  nextActionExecution,
  partitionPersonaNotes,
  personaInitials,
  preferredOperableOpportunityId,
  resolvePersonaSection,
  visiblePersonaSections,
  visibleTimelineActivities,
  type GrowthPersonaSectionId,
} from "@/lib/growth/persona-workspace";
import { cn } from "@/lib/utils";
import {
  PersonaActivityList,
  PersonaAssessmentCard,
  PersonaAssessmentHistory,
  PersonaContactCard,
  PersonaConversationList,
  PersonaNextStep,
  PersonaNotesList,
  PersonaOpportunityList,
  PersonaSignalRow,
  formatPersonaWhen,
  personaPanelClass,
} from "./persona/PersonaCommercialRecord";
import {
  PersonaFollowUpForm,
  PersonaQuickActions,
  PersonaWorkPanel,
} from "./persona/PersonaWorkActions";

export interface PersonaDetailClientProps {
  persona: GrowthPersonaDetailView;
  section?: string;
  focusOportunidadId?: string;
  canOpenSales?: boolean;
  canOpenMessages?: boolean;
  canOpenActivity?: boolean;
  canOperate?: boolean;
  members?: Array<{ userId: string; label: string }>;
}

function arrivedLabel(originLabel: string): string {
  const trimmed = originLabel.trim();
  if (!trimmed) return "Sin origen claro";
  if (trimmed.toLowerCase().startsWith("llegó")) return trimmed;
  return `${GROWTH_PERSONAS_ARRIVED_PREFIX} ${trimmed}`;
}

function sectionHref(
  pathname: string,
  section: GrowthPersonaSectionId,
  oportunidadId?: string
): string {
  const params = new URLSearchParams();
  if (section !== "resumen") params.set("seccion", section);
  if (oportunidadId) params.set("oportunidad", oportunidadId);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

type SectionScrollHint = "none" | "end" | "start" | "both";

const SECTION_SCROLL_MASK: Record<Exclude<SectionScrollHint, "none">, string> = {
  end: "linear-gradient(to right, #000 calc(100% - 2.25rem), transparent)",
  start: "linear-gradient(to right, transparent, #000 1rem)",
  both: "linear-gradient(to right, transparent, #000 1rem, #000 calc(100% - 2.25rem), transparent)",
};

function PersonaSectionNav({
  pathname,
  section,
  sections,
  focusOportunidadId,
}: {
  pathname: string;
  section: GrowthPersonaSectionId;
  sections: Array<{ id: GrowthPersonaSectionId; label: string }>;
  focusOportunidadId?: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [hint, setHint] = useState<SectionScrollHint>("none");

  const syncScrollHint = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const narrow = window.matchMedia("(max-width: 639px)").matches;
    const max = el.scrollWidth - el.clientWidth;
    const start = el.scrollLeft > 1;
    const end = max - el.scrollLeft > 1;
    const next: SectionScrollHint = !narrow || max <= 1
      ? "none"
      : start && end
        ? "both"
        : end
          ? "end"
          : start
            ? "start"
            : "none";
    setHint((prev) => (prev === next ? prev : next));
  }, []);

  const sectionKey = sections.map((item) => item.id).join("\n");

  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    let alive = true;
    const revealCurrent = () => {
      if (!alive) return;
      el.querySelector<HTMLElement>("[aria-current='page']")?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
      syncScrollHint();
    };
    revealCurrent();
    const observer = new ResizeObserver(() => syncScrollHint());
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    const media = window.matchMedia("(max-width: 639px)");
    media.addEventListener("change", syncScrollHint);
    void document.fonts?.ready.then(revealCurrent);
    return () => {
      alive = false;
      observer.disconnect();
      media.removeEventListener("change", syncScrollHint);
    };
  }, [section, sectionKey, syncScrollHint]);

  const mask = hint === "none" ? undefined : SECTION_SCROLL_MASK[hint];

  return (
    <div className="mt-4 border-b border-[var(--admin-border-subtle)]">
      <nav
        ref={navRef}
        aria-label="Secciones de la persona"
        onScroll={syncScrollHint}
        className="flex gap-1 overflow-x-auto overscroll-x-contain scroll-px-8"
        style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      >
        {sections.map((item) => {
          const current = item.id === section;
          return (
            <Link
              key={item.id}
              href={sectionHref(pathname, item.id, focusOportunidadId)}
              aria-current={current ? "page" : undefined}
              onFocus={(event) => {
                event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
              }}
              className={cn(
                "shrink-0 border-b-2 px-2 py-2.5 text-[13px] font-medium sm:px-3 sm:text-sm",
                current
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PersonaDetailClient({
  persona,
  section: requestedSection,
  focusOportunidadId,
  canOpenSales = false,
  canOpenMessages = false,
  canOpenActivity = false,
  canOperate = false,
  members = [],
}: PersonaDetailClientProps) {
  const [work, setWork] = useState<null | "contact" | "next">(null);
  const pathname = usePathname();
  const assessments = persona.workspace?.assessments ?? [];
  const section = resolvePersonaSection(requestedSection, assessments.length > 0);
  const sections = visiblePersonaSections(assessments.length > 0);
  const latest = assessments[0];
  const notes = partitionPersonaNotes(persona.activities);
  const timeline = visibleTimelineActivities(persona.activities, {
    omitSourceIds: section === "resumen" ? assessments.map((item) => item.id) : [],
  });
  const resumenTimeline = timeline.slice(0, 5);
  const conversations = persona.conversations ?? [];
  const contactLine = [persona.email, persona.phone].filter(Boolean);
  const action = persona.primaryNextAction;
  const actionAssessment = action
    ? assessments.find((item) => item.oportunidadId === action.oportunidadId)
    : undefined;
  const due = formatPersonaWhen(action?.dueAt);
  const targetId = preferredOperableOpportunityId(
    persona.oportunidades.map((item) => ({ id: item.id, status: item.status })),
    action?.oportunidadId
  );
  const execution = action
    ? nextActionExecution({
        kind: action.kind,
        reportPath: actionAssessment?.reportPath,
        conversationId: canOpenMessages ? conversations[0]?.id : undefined,
      })
    : null;
  const operable = Boolean(canOperate && targetId);

  useEffect(() => {
    if (section !== "oportunidades" || !focusOportunidadId) return;
    const el = document.getElementById(`oportunidad-${focusOportunidadId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [section, focusOportunidadId]);

  return (
    <AdminModulePage
      hideTitle
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: GROWTH_PERSONAS_PAGE_TITLE, href: "/admin/personas" },
        { label: persona.displayName },
      ]}
      title={persona.displayName}
    >
      <div className="space-y-4" data-persona-detail>
        <header>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3.5">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_14%,white)] text-sm font-semibold text-primary"
                aria-hidden
              >
                {personaInitials(persona.displayName)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {persona.displayName}
                  </h1>
                  <StatusBadge
                    tone={persona.status === "active" ? "active" : "inactive"}
                    label={persona.statusLabel}
                  />
                </div>
                <p className="mt-1 text-sm text-muted">{arrivedLabel(persona.originLabel)}</p>
                <div className="mt-2 flex flex-col gap-1 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-x-4">
                  {persona.email ? (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{persona.email}</span>
                    </span>
                  ) : null}
                  {persona.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {persona.phone}
                    </span>
                  ) : null}
                  {contactLine.length === 0 ? <span>Sin correo ni teléfono</span> : null}
                </div>
              </div>
            </div>
            <Button href="/admin/personas" variant="outline" size="sm" className="shrink-0 rounded-full">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Volver a personas
            </Button>
          </div>
          <PersonaSectionNav
            pathname={pathname}
            section={section}
            sections={sections}
            focusOportunidadId={focusOportunidadId}
          />
        </header>

        <PersonaQuickActions
          canOperate={operable}
          messagesHref={
            canOpenMessages && conversations[0]
              ? `/admin/mensajes?c=${encodeURIComponent(conversations[0].id)}`
              : undefined
          }
          onContact={() => setWork("contact")}
          onNext={() => setWork("next")}
        />
        {work && targetId ? (
          <PersonaWorkPanel
            mode={work}
            oportunidadId={targetId}
            initialSummary={action?.oportunidadId === targetId ? action.summary : ""}
            initialKind={action?.oportunidadId === targetId ? action.kind : undefined}
            hasCurrent={Boolean(action && action.oportunidadId === targetId)}
            onDone={() => setWork(null)}
          />
        ) : null}

        {section === "resumen" ? (
          <div className="space-y-3">
            <PersonaSignalRow signals={persona.workspace?.signals ?? []} />
            <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.75fr)]">
              <div>
                <PersonaNextStep
                  label={GROWTH_NEXT_ACTION_SECTION_LABEL}
                  emptyLabel={GROWTH_NO_NEXT_ACTION_LABEL}
                  summary={action?.summary}
                  kindLabel={action?.kindLabel}
                  support={
                    action
                      ? [
                          actionAssessment
                            ? `${actionAssessment.title}: ${actionAssessment.headline}.`
                            : "",
                          [action.oportunidadTypeLabel, due ? `Para ${due}` : ""].filter(Boolean).join(" · "),
                        ].filter(Boolean)
                      : undefined
                  }
                  reportHref={execution?.type === "report" ? execution.href : undefined}
                  salesHref={
                    action && canOpenSales
                      ? `/admin/ventas/${encodeURIComponent(action.oportunidadId)}`
                      : undefined
                  }
                  salesLabel={GROWTH_PERSONAS_OPEN_IN_SALES}
                  messagesHref={execution?.type === "messages" ? execution.href : undefined}
                  messagesLabel={GROWTH_PERSONAS_OPEN_IN_MESSAGES}
                  opportunityHref={
                    action ? sectionHref(pathname, "oportunidades", action.oportunidadId) : undefined
                  }
                  onUpdate={operable ? () => setWork("next") : undefined}
                  onRegisterContact={
                    operable && action?.kind === "contact" ? () => setWork("contact") : undefined
                  }
                />
              </div>
              <PersonaContactCard
                email={persona.email}
                phone={persona.phone}
                organizationName={latest?.organizationName}
                originLabel={persona.originLabel}
              />
            </div>
            {latest ? (
              <Link
                href={sectionHref(pathname, "diagnosticos", focusOportunidadId)}
                className={cn(personaPanelClass, "block px-3 py-2.5 text-sm")}
              >
                <span className="font-semibold text-foreground">{latest.title}</span>
                <span className="text-muted"> · {latest.headline}</span>
              </Link>
            ) : null}
            <section className={cn(personaPanelClass, "px-3 py-3 sm:px-4")}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Actividad reciente</p>
                  <Link
                    href={sectionHref(pathname, "actividad", focusOportunidadId)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Ver toda la actividad
                  </Link>
                </div>
                <PersonaActivityList
                  activities={resumenTimeline}
                  emptyTitle={GROWTH_PERSONAS_ACTIVITY_EMPTY_TITLE}
                  emptyDescription={GROWTH_PERSONAS_ACTIVITY_EMPTY_DESCRIPTION}
                  relatedHref={(id) => sectionHref(pathname, "oportunidades", id)}
                  reportHref={(activity) =>
                    assessments.find((item) => item.id === activity.sourceId)?.reportPath
                  }
                />
              </section>
          </div>
        ) : null}

        {section === "diagnosticos" && latest ? (
          <div className="space-y-4">
            <PersonaAssessmentCard
              assessment={latest}
              capturedLabel={formatPersonaWhen(latest.capturedAt)}
              sourceLabel={persona.originLabel}
            />
            <PersonaAssessmentHistory
              assessments={assessments.slice(1)}
              sourceLabel={persona.originLabel}
            />
          </div>
        ) : null}

        {section === "oportunidades" ? (
          <PersonaOpportunityList
            oportunidades={persona.oportunidades}
            focusOportunidadId={focusOportunidadId}
            primaryOportunidadId={action?.oportunidadId}
            canOpenSales={canOpenSales}
            detailHref={(id) => sectionHref(pathname, "oportunidades", id)}
            relatedHistoryLabel={GROWTH_RELATED_HISTORY_LABEL}
            emptyTitle={GROWTH_PERSONAS_OPPORTUNITIES_EMPTY_TITLE}
            emptyDescription={GROWTH_PERSONAS_OPPORTUNITIES_EMPTY_DESCRIPTION}
            noNextActionLabel={GROWTH_NO_NEXT_ACTION_LABEL}
            openInSalesLabel={GROWTH_PERSONAS_OPEN_IN_SALES}
            viewDetailLabel={GROWTH_VIEW_DETAIL_LABEL}
            canOperate={canOperate}
            members={members}
          />
        ) : null}

        {section === "actividad" ? (
          <div className="space-y-4">
            <section className={cn(personaPanelClass, "px-4 py-4 sm:px-5")}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {GROWTH_TIMELINE_SECTION_LABEL}
                </p>
                {canOpenActivity ? (
                  <Link
                    href="/admin/actividad"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {GROWTH_PERSONAS_OPEN_ACTIVITY}
                  </Link>
                ) : null}
              </div>
              <PersonaActivityList
                activities={timeline}
                emptyTitle={GROWTH_PERSONAS_ACTIVITY_EMPTY_TITLE}
                emptyDescription={GROWTH_PERSONAS_ACTIVITY_EMPTY_DESCRIPTION}
                relatedHref={(id) => sectionHref(pathname, "oportunidades", id)}
                reportHref={(activity) =>
                  assessments.find((item) => item.id === activity.sourceId)?.reportPath
                }
              />
            </section>
            <section data-persona-conversations>
              <div className="mb-2">
                <p className="text-sm font-semibold text-foreground">
                  {GROWTH_PERSONAS_CONVERSATIONS_SECTION}
                </p>
                <p className="text-xs text-muted">Contexto reciente, sin bandeja.</p>
              </div>
              {conversations.length === 0 ? (
                <EmptyState
                  title={GROWTH_PERSONAS_CONVERSATIONS_EMPTY_TITLE}
                  description={GROWTH_PERSONAS_CONVERSATIONS_EMPTY_DESCRIPTION}
                  className="bg-[var(--admin-surface)] py-8"
                />
              ) : (
                <PersonaConversationList
                  conversations={conversations}
                  canOpenMessages={canOpenMessages}
                  openLabel={GROWTH_PERSONAS_OPEN_IN_MESSAGES}
                />
              )}
            </section>
          </div>
        ) : null}

        {section === "notas" ? (
          <div className="space-y-3">
            {operable && targetId ? (
              <section className={cn(personaPanelClass, "px-3 py-3")}>
                <p className="mb-2 text-sm font-semibold text-foreground">Agregar nota</p>
                <PersonaFollowUpForm oportunidadId={targetId} kind="note" />
              </section>
            ) : null}
            <PersonaNotesList notes={notes.human} automatic={notes.automatic} />
          </div>
        ) : null}
      </div>
    </AdminModulePage>
  );
}
