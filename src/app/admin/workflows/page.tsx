import Link from "next/link";
import { WorkflowAdminClient } from "@/components/workflow/WorkflowAdminClient";
import { AdminSystemPanel } from "@/components/admin/AdminSystemPanel";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function AdminWorkflowsPage() {
  return (
    <AdminSystemPanel
      meta={ADMIN_PANEL_META.workflows}
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Workflow Engine" },
      ]}
      title="Workflow Engine"
      description="Definiciones, instancias e historial de flujos editoriales"
      actions={
        <Link href="/admin/config">
          <Button variant="outline">Configuración</Button>
        </Link>
      }
    >
      <WorkflowAdminClient />
    </AdminSystemPanel>
  );
}
