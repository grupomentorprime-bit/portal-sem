"use client";

import Link from "next/link";
import { ChevronRight, Workflow } from "lucide-react";
import { EmptyState, StatusBadge, aek } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import {
  AUTOMATION_CREATE_CTA,
  AUTOMATION_EMPTY_DESCRIPTION,
  AUTOMATION_EMPTY_TITLE,
  AUTOMATION_PAGE_DESCRIPTION,
  AUTOMATION_PAGE_TITLE,
  automationStatusTone,
} from "@/lib/growth/automations-labels";
import type { AutomationListItemView } from "@/lib/growth/automations-read";
import { cn } from "@/lib/utils";

export interface AutomatizacionesListClientProps {
  items: AutomationListItemView[];
  canManage: boolean;
}

const rowClass = cn(
  aek.surface,
  "shadow-[var(--admin-shadow-panel)] transition duration-150",
  "hover:border-[color-mix(in_srgb,var(--color-primary)_20%,var(--admin-border-subtle))]"
);

export function AutomatizacionesListClient({
  items,
  canManage,
}: AutomatizacionesListClientProps) {
  const isEmpty = items.length === 0;

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: AUTOMATION_PAGE_TITLE },
      ]}
      title={AUTOMATION_PAGE_TITLE}
      description={AUTOMATION_PAGE_DESCRIPTION}
      actions={
        canManage ? (
          <Button href="/admin/automatizaciones/nueva" size="sm">
            {AUTOMATION_CREATE_CTA}
          </Button>
        ) : null
      }
    >
      {isEmpty ? (
        <EmptyState
          title={AUTOMATION_EMPTY_TITLE}
          description={
            canManage
              ? AUTOMATION_EMPTY_DESCRIPTION
              : "Cuando tu equipo cree automatizaciones, aparecerán aquí."
          }
          icon={<Workflow className="h-8 w-8" />}
          action={
            canManage
              ? {
                  label: AUTOMATION_CREATE_CTA,
                  href: "/admin/automatizaciones/nueva",
                }
              : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  rowClass,
                  "flex items-start gap-4 px-4 py-4 no-underline"
                )}
              >
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold tracking-tight text-foreground">
                      {item.name}
                    </p>
                    <StatusBadge
                      tone={automationStatusTone(item.status)}
                      label={item.statusLabel}
                    />
                  </div>
                  <div className="space-y-1 text-sm text-muted">
                    <p>
                      <span className={cn(aek.label, "mr-2")}>Cuándo</span>
                      {item.whenLabel}
                    </p>
                    <p>
                      <span className={cn(aek.label, "mr-2")}>Qué hace</span>
                      {item.thenLabel}
                    </p>
                  </div>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminModulePage>
  );
}
