"use client";

import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { StudentAffairsOperationsPanel } from "@/components/admin/student-affairs/StudentAffairsOperationsPanel";
import { STUDENT_AFFAIRS_HOME_PATH } from "@/lib/admin/nav-access";
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
        { label: "Inicio", href: STUDENT_AFFAIRS_HOME_PATH },
        { label: "Formularios" },
        { label: "Operación", href: STUDENT_AFFAIRS_HOME_PATH },
        { label: formName },
      ]}
      title={formName}
      actions={
        <Button variant="outline" size="sm" href={STUDENT_AFFAIRS_HOME_PATH}>
          Volver a operación
        </Button>
      }
      className="[&_header]:mb-3 [&_header]:pb-3"
    >
      <StudentAffairsOperationsPanel formId={formId} formName={formName} />
    </AdminModulePage>
  );
}

export function StudentAffairsFormNotFoundClient() {
  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: STUDENT_AFFAIRS_HOME_PATH },
        { label: "Formularios" },
        { label: "Operación", href: STUDENT_AFFAIRS_HOME_PATH },
        { label: "Formulario no encontrado" },
      ]}
      title="Formulario no encontrado"
    >
      <p className="text-sm text-muted">El formulario solicitado no existe.</p>
      <Button variant="outline" size="sm" className="mt-4" href={STUDENT_AFFAIRS_HOME_PATH}>
        Volver
      </Button>
    </AdminModulePage>
  );
}
