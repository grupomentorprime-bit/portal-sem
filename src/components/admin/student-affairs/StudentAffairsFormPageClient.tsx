"use client";

import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { StudentAffairsOperationsPanel } from "@/components/admin/student-affairs/StudentAffairsOperationsPanel";
import { Button } from "@/components/ui/button";

interface StudentAffairsFormPageClientProps {
  formId: string;
  formName: string;
}

export function StudentAffairsFormPageClient({
  formId,
  formName,
}: StudentAffairsFormPageClientProps) {
  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Formularios" },
        { label: "Operación", href: "/admin/portal/asuntos-estudiantiles" },
        { label: formName },
      ]}
      title={formName}
      actions={
        <Button variant="outline" size="sm" href="/admin/portal/asuntos-estudiantiles">
          Volver a operación
        </Button>
      }
      className="[&_header]:mb-3 [&_header]:pb-3"
    >
      <StudentAffairsOperationsPanel formId={formId} />
    </AdminModulePage>
  );
}

export function StudentAffairsFormNotFoundClient() {
  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Formularios" },
        { label: "Operación", href: "/admin/portal/asuntos-estudiantiles" },
        { label: "Formulario no encontrado" },
      ]}
      title="Formulario no encontrado"
    >
      <p className="text-sm text-muted">El formulario solicitado no existe.</p>
      <Button variant="outline" size="sm" className="mt-4" href="/admin/portal/asuntos-estudiantiles">
        Volver
      </Button>
    </AdminModulePage>
  );
}
