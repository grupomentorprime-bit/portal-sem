import { WorkflowAdminClient } from "@/components/workflow/WorkflowAdminClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminWorkflowsPage() {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Workflow Engine</h1>
            <p className="text-sm text-muted">Definiciones, instancias e historial</p>
          </div>
          <Link href="/admin/config" className="text-sm text-muted underline">
            Volver al CMS
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <WorkflowAdminClient />
      </main>
    </div>
  );
}
