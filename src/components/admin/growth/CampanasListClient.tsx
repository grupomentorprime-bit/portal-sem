"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { EmptyState, StatusBadge, aek } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import {
  CAMPAIGN_CREATE_CTA,
  CAMPAIGN_EMPTY_DESCRIPTION,
  CAMPAIGN_EMPTY_TITLE,
  CAMPAIGN_NEW_CTA,
  CAMPAIGN_PAGE_DESCRIPTION,
  CAMPAIGN_PAGE_TITLE,
  CAMPAIGN_VIEW_CTA,
  campaignStatusTone,
} from "@/lib/growth/campaigns-labels";
import type {
  CampaignListItemView,
  CampaignListSummary,
} from "@/lib/growth/campaigns-read";
import { cn } from "@/lib/utils";

export interface CampanasListClientProps {
  items: CampaignListItemView[];
  summary: CampaignListSummary;
  canManage: boolean;
}

const rowClass = cn(
  aek.surface,
  "shadow-[var(--admin-shadow-panel)] transition duration-150",
  "hover:border-[color-mix(in_srgb,var(--color-primary)_20%,var(--admin-border-subtle))]"
);

function formatCount(n: number): string {
  return new Intl.NumberFormat("es-CL").format(n);
}

export function CampanasListClient({
  items,
  summary,
  canManage,
}: CampanasListClientProps) {
  const isEmpty = items.length === 0;

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: CAMPAIGN_PAGE_TITLE },
      ]}
      title={CAMPAIGN_PAGE_TITLE}
      description={CAMPAIGN_PAGE_DESCRIPTION}
      actions={
        canManage ? (
          <Button href="/admin/campanas/nueva" size="sm">
            {CAMPAIGN_NEW_CTA}
          </Button>
        ) : null
      }
    >
      {isEmpty ? (
        <div data-campanas-empty>
          <EmptyState
            title={CAMPAIGN_EMPTY_TITLE}
            description={
              canManage
                ? CAMPAIGN_EMPTY_DESCRIPTION
                : "Cuando tu equipo cree campañas, aparecerán aquí."
            }
            icon={<Megaphone className="h-8 w-8" strokeWidth={1.5} />}
            action={
              canManage
                ? {
                    label: CAMPAIGN_CREATE_CTA,
                    href: "/admin/campanas/nueva",
                  }
                : undefined
            }
            className="border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-8 py-16 shadow-[var(--admin-shadow-panel)] sm:py-20"
          />
        </div>
      ) : (
        <div className={aek.sectionGap} data-campanas-list>
          <section
            aria-label="Resumen de campañas"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <SummaryStat
              label="Campañas activas"
              value={formatCount(summary.activeCount)}
            />
            <SummaryStat
              label="Personas captadas"
              value={formatCount(summary.personasCaptadas)}
            />
            <SummaryStat
              label="Oportunidades"
              value={formatCount(summary.oportunidades)}
            />
            <SummaryStat
              label="Ganadas"
              value={formatCount(summary.ganadas)}
            />
          </section>

          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    rowClass,
                    "flex flex-col gap-4 px-4 py-4 no-underline sm:flex-row sm:items-center sm:gap-6 sm:px-5"
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                        {item.name}
                      </p>
                      <StatusBadge
                        tone={campaignStatusTone(item.status)}
                        label={item.statusLabel}
                      />
                    </div>
                    <p className="text-sm text-muted">{item.objective}</p>
                    <p className="text-sm text-muted">
                      <span className="text-foreground/80">{item.sourceLabel}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-end justify-between gap-3 sm:flex-col sm:items-end sm:text-right">
                    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm sm:flex-col sm:items-end sm:gap-0.5">
                      <div>
                        <dt className="sr-only">Personas</dt>
                        <dd className="text-foreground">
                          <span className="font-semibold">
                            {formatCount(item.metrics.personasCaptadas)}
                          </span>{" "}
                          <span className="text-muted">personas</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">Oportunidades</dt>
                        <dd className="text-foreground">
                          <span className="font-semibold">
                            {formatCount(item.metrics.oportunidadesGeneradas)}
                          </span>{" "}
                          <span className="text-muted">oportunidades</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">Ganadas</dt>
                        <dd className="text-foreground">
                          <span className="font-semibold">
                            {formatCount(item.metrics.ganadas)}
                          </span>{" "}
                          <span className="text-muted">ganadas</span>
                        </dd>
                      </div>
                    </dl>
                    <span className="inline-flex shrink-0 items-center text-xs font-semibold text-primary">
                      {CAMPAIGN_VIEW_CTA}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminModulePage>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn(aek.surfaceMuted, "px-3.5 py-3")}>
      <p className={aek.label}>{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
