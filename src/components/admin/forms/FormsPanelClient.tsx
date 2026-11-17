"use client";

import Link from "next/link";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { EmptyState } from "@/components/admin/kit/states/EmptyState";
import { FormSubmissionsPanel } from "@/components/admin/forms/FormSubmissionsPanel";
import { Button } from "@/components/ui/button";
import { CONGRESS_VARONES_FORM_ID } from "@/lib/experience/forms/already-enrolled";
import type { ExperienceFormField } from "@/types/experience-forms";

export interface FormsPanelRow {
  id: string;
  name: string;
  responses: number;
}

function responseLabel(count: number): string {
  if (count === 1) return "1 respuesta";
  return `${count} respuestas`;
}

export function FormsPanelClient({ rows }: { rows: FormsPanelRow[] }) {
  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Sitio web", href: "/admin/site/pages" },
        { label: "Formularios", href: "/admin/portal/forms" },
        { label: "Operación" },
      ]}
      title="Operación"
      description="Respuestas y administración operativa de los formularios de este espacio."
    >
      {rows.length === 0 ? (
        <EmptyState
          title="Sin formularios"
          description="Este espacio todavía no tiene formularios."
        />
      ) : (
        <ul className="divide-y divide-[var(--color-border-default)] overflow-hidden rounded-xl border border-[var(--color-border-default)]">
          {rows.map((row) => {
            const isCongressOps = row.id === CONGRESS_VARONES_FORM_ID;
            return (
              <li key={row.id}>
                <Link
                  href={`/admin/portal/forms/panel/${encodeURIComponent(row.id)}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-[var(--gray-50)]"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-[var(--gray-900)]">{row.name}</span>
                    {isCongressOps ? (
                      <span className="mt-0.5 block text-xs text-[var(--gray-500)]">
                        Administración operativa del congreso
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[var(--gray-500)]">
                    {isCongressOps ? "Abrir panel" : responseLabel(row.responses)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AdminModulePage>
  );
}

export function FormsPanelDetailClient({
  formId,
  formName,
  fields,
}: {
  formId: string;
  formName: string;
  fields: ExperienceFormField[];
}) {
  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Sitio web", href: "/admin/site/pages" },
        { label: "Formularios", href: "/admin/portal/forms" },
        { label: "Operación", href: "/admin/portal/forms/panel" },
        { label: formName },
      ]}
      title={formName}
      description="Respuestas de este formulario en este espacio."
      actions={
        <Button
          variant="outline"
          size="sm"
          href={`/admin/portal/forms/${encodeURIComponent(formId)}`}
        >
          Editar
        </Button>
      }
    >
      <FormSubmissionsPanel formId={formId} fields={fields} />
    </AdminModulePage>
  );
}
