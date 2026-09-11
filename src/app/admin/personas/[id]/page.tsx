import { PersonaDetailClient } from "@/components/admin/growth/PersonaDetailClient";
import { EmptyState } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { getGrowthPersonaDetailView } from "@/lib/growth/personas-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { UserRoundX } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ oportunidad?: string }>;
}

export default async function AdminPersonaDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId) {
    redirect("/admin/login?next=/admin/personas");
  }

  const { id } = await params;
  const { oportunidad } = await searchParams;
  const persona = await getGrowthPersonaDetailView(tenantId, id);

  if (!persona) {
    return (
      <AdminModulePage
        breadcrumbs={[
          { label: "Inicio", href: "/admin" },
          { label: "Personas", href: "/admin/personas" },
          { label: "No encontrada" },
        ]}
        title="Persona no encontrada"
      >
        <EmptyState
          title="No encontramos esta Persona"
          description="Puede que no exista en este Espacio o que el enlace sea incorrecto."
          icon={<UserRoundX className="h-8 w-8" />}
          action={{ label: "Volver a Personas", href: "/admin/personas" }}
        />
        <div className="mt-4">
          <Button href="/admin/personas" variant="outline" size="sm">
            Personas
          </Button>
        </div>
      </AdminModulePage>
    );
  }

  return (
    <PersonaDetailClient
      persona={persona}
      focusOportunidadId={oportunidad?.trim() || undefined}
    />
  );
}
