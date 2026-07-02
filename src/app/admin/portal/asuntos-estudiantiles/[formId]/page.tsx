import { StudentAffairsOperationsPanel } from "@/components/admin/student-affairs/StudentAffairsOperationsPanel";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { Button } from "@/components/ui/button";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { getTenantContext } from "@/core/tenant";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ formId: string }>;
}

export default async function StudentAffairsFormPage({ params }: PageProps) {
  const { formId } = await params;
  const ctx = await getTenantContext();
  if (!ctx) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  const form = await getExperienceFormById(ctx.tenantId, formId);
  if (!form) {
    return (
      <AdminModuleLayout
        breadcrumbs={[
          { label: "Inicio", href: "/admin" },
          { label: "Asuntos estudiantiles", href: "/admin/portal/asuntos-estudiantiles" },
          { label: "Formulario no encontrado" },
        ]}
        title="Formulario no encontrado"
      >
        <p className="text-sm text-muted">El formulario solicitado no existe.</p>
        <Button variant="outline" size="sm" className="mt-4" href="/admin/portal/asuntos-estudiantiles">
          Volver
        </Button>
      </AdminModuleLayout>
    );
  }

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Asuntos estudiantiles", href: "/admin/portal/asuntos-estudiantiles" },
        { label: form.name },
      ]}
      title={form.name}
      description="Respuestas, gestión de inasistencias y check-in del día de la jornada."
      actions={
        <Button variant="outline" size="sm" href="/admin/portal/asuntos-estudiantiles">
          Todos los formularios
        </Button>
      }
    >
      <StudentAffairsOperationsPanel
        formId={form._id}
        formName={form.name}
        formDescription={form.description}
      />
    </AdminModuleLayout>
  );
}
